from fastapi import APIRouter, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from app.controllers.analysis_controller import analizar_frame_controller
from app.DTOs.analysis_dto import AnalisisResponseDTO
from app.services.ml_service import procesar_frame
import requests
import asyncio
import logging
import os
import datetime
import base64
import time
from collections import deque

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Analisis de Aves"]
)

ALLOWED_STREAM_MODES = {"publisher", "viewer"}
WS_CLOSE_INVALID_MODE = 4400
WS_CLOSE_MISSING_CAMERA_ID = 4401
WS_CLOSE_STREAM_ERROR = 4500
DIAGNOSTIC_PUSH_INTERVAL_SECONDS = 2.0
ENABLE_DETECTION_PHOTO_UPLOAD = os.getenv("ENABLE_DETECTION_PHOTO_UPLOAD", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
DIAGNOSTIC_FRAME_BASE64 = (
    "data:image/jpeg;base64,"
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQ"
    "ERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU"
    "FBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAA"
    "gEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0"
    "RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJ"
    "ytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECB"
    "AQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERU"
    "ZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK"
    "0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD8qqKKKAP/2Q=="
)

camera_viewers: dict[str, set[WebSocket]] = {}


def current_timestamp_ms() -> int:
    return int(datetime.datetime.now().timestamp() * 1000)


def socket_client_label(websocket: WebSocket) -> str:
    if websocket.client is None:
        return "unknown"
    return f"{websocket.client.host}:{websocket.client.port}"


def get_viewer_count(camera_id: str) -> int:
    return len(camera_viewers.get(camera_id, set()))


def add_viewer(camera_id: str, websocket: WebSocket) -> int:
    if camera_id not in camera_viewers:
        camera_viewers[camera_id] = set()
    camera_viewers[camera_id].add(websocket)
    return len(camera_viewers[camera_id])


def remove_viewer(camera_id: str, websocket: WebSocket) -> int:
    if camera_id not in camera_viewers:
        return 0

    camera_viewers[camera_id].discard(websocket)
    if len(camera_viewers[camera_id]) == 0:
        del camera_viewers[camera_id]
        return 0

    return len(camera_viewers[camera_id])


async def close_invalid_request(websocket: WebSocket, code: int, reason: str) -> None:
    try:
        await websocket.close(code=code, reason=reason)
    except RuntimeError:
        logger.debug("No fue posible cerrar websocket invalid request | code=%s | reason=%s", code, reason)


async def broadcast_to_viewers(camera_id: str, payload: dict) -> None:
    viewers = list(camera_viewers.get(camera_id, set()))
    if not viewers:
        return

    disconnected_viewers: list[WebSocket] = []

    for viewer in viewers:
        try:
            await viewer.send_json(payload)
        except Exception as error:
            logger.warning(
                "WS broadcast viewer drop | camera_id=%s | error=%s",
                camera_id,
                str(error),
            )
            disconnected_viewers.append(viewer)

    for viewer in disconnected_viewers:
        before_cleanup = get_viewer_count(camera_id)
        after_cleanup = remove_viewer(camera_id, viewer)
        logger.info(
            "WS broadcast cleanup | camera_id=%s | before=%s | after=%s",
            camera_id,
            before_cleanup,
            after_cleanup,
        )


@router.post("/analizar_frame", response_model=AnalisisResponseDTO)
async def endpoint_analizar_frame(
    archivo: UploadFile = File(...),
    id_dispositivo: str = Form("Desconocido"),
    ubicacion: str = Form("Desconocida")
):
    """
    Recibe una imagen (frame) y devuelve las detecciones de aves usando YOLO.
    """
    return await analizar_frame_controller(archivo, id_dispositivo, ubicacion)


@router.websocket("/ws/video_stream")
async def video_stream(
    websocket: WebSocket,
    camera_id: str = "",
    mode: str = "publisher",
):
    """
    WebSocket para stream de video.
    - publisher: envia frames para analisis.
    - viewer: recibe frames procesados + detecciones por camera_id.
    """
    await websocket.accept()

    normalized_camera_id = (camera_id or "").strip()
    normalized_mode = (mode or "").strip().lower()
    client = socket_client_label(websocket)
    raw_query = websocket.url.query

    logger.info(
        "WS incoming | path=/ws/video_stream | mode=%s | camera_id=%s | client=%s | query=%s",
        normalized_mode,
        normalized_camera_id,
        client,
        raw_query,
    )

    if normalized_mode not in ALLOWED_STREAM_MODES:
        logger.warning(
            "WS invalid mode | mode=%s | camera_id=%s | client=%s",
            normalized_mode,
            normalized_camera_id,
            client,
        )
        await close_invalid_request(websocket, WS_CLOSE_INVALID_MODE, "invalid_mode")
        return

    if not normalized_camera_id:
        logger.warning(
            "WS missing camera_id | mode=%s | client=%s | query=%s",
            normalized_mode,
            client,
            raw_query,
        )
        await close_invalid_request(websocket, WS_CLOSE_MISSING_CAMERA_ID, "missing_camera_id")
        return

    if normalized_mode == "viewer":
        await handle_viewer_stream(websocket, normalized_camera_id, client)
        return

    await handle_publisher_stream(websocket, normalized_camera_id, client)


@router.websocket("/ws/video_stream/diagnostic")
async def video_stream_diagnostic(
    websocket: WebSocket,
    camera_id: str = "",
):
    await websocket.accept()

    normalized_camera_id = (camera_id or "").strip()
    client = socket_client_label(websocket)
    raw_query = websocket.url.query

    logger.info(
        "WS incoming | path=/ws/video_stream/diagnostic | camera_id=%s | client=%s | query=%s",
        normalized_camera_id,
        client,
        raw_query,
    )

    if not normalized_camera_id:
        logger.warning(
            "WS diagnostic missing camera_id | client=%s | query=%s",
            client,
            raw_query,
        )
        await close_invalid_request(websocket, WS_CLOSE_MISSING_CAMERA_ID, "missing_camera_id")
        return

    await websocket.send_json(
        {
            "type": "viewer_connected",
            "camera_id": normalized_camera_id,
            "timestamp": current_timestamp_ms(),
            "diagnostic": True,
        }
    )
    logger.info(
        "WS diagnostic ack sent | camera_id=%s | client=%s",
        normalized_camera_id,
        client,
    )

    try:
        while True:
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=DIAGNOSTIC_PUSH_INTERVAL_SECONDS,
                )
                if message == "ping":
                    continue

                logger.info(
                    "WS diagnostic message | camera_id=%s | client=%s | payload=%s",
                    normalized_camera_id,
                    client,
                    message[:120],
                )
            except asyncio.TimeoutError:
                await websocket.send_json(
                    {
                        "timestamp": current_timestamp_ms(),
                        "frameBase64": DIAGNOSTIC_FRAME_BASE64,
                        "detecciones": [],
                        "diagnostic": True,
                    }
                )
    except WebSocketDisconnect:
        logger.info(
            "WS disconnected | branch=diagnostic | camera_id=%s | client=%s",
            normalized_camera_id,
            client,
        )
    except Exception as error:
        logger.exception(
            "WS error | branch=diagnostic | camera_id=%s | client=%s | error=%s",
            normalized_camera_id,
            client,
            str(error),
        )


async def handle_viewer_stream(websocket: WebSocket, camera_id: str, client: str) -> None:
    logger.info(
        "WS branch selected | branch=viewer | camera_id=%s | client=%s",
        camera_id,
        client,
    )

    viewers_before = get_viewer_count(camera_id)
    viewers_after = add_viewer(camera_id, websocket)

    logger.info(
        "WS viewer registered | camera_id=%s | before=%s | after=%s | client=%s",
        camera_id,
        viewers_before,
        viewers_after,
        client,
    )

    await websocket.send_json(
        {
            "type": "viewer_connected",
            "camera_id": camera_id,
            "timestamp": current_timestamp_ms(),
        }
    )

    try:
        while True:
            message = await websocket.receive_text()
            if message == "ping":
                continue

            logger.info(
                "WS viewer message | camera_id=%s | client=%s | payload=%s",
                camera_id,
                client,
                message[:120],
            )
    except WebSocketDisconnect:
        logger.info(
            "WS disconnected | branch=viewer | camera_id=%s | client=%s",
            camera_id,
            client,
        )
    except Exception as error:
        logger.exception(
            "WS error | branch=viewer | camera_id=%s | client=%s | error=%s",
            camera_id,
            client,
            str(error),
        )
        await close_invalid_request(websocket, WS_CLOSE_STREAM_ERROR, "viewer_stream_error")
    finally:
        before_cleanup = get_viewer_count(camera_id)
        after_cleanup = remove_viewer(camera_id, websocket)
        logger.info(
            "WS viewer cleanup | camera_id=%s | before=%s | after=%s | client=%s",
            camera_id,
            before_cleanup,
            after_cleanup,
            client,
        )


async def handle_publisher_stream(websocket: WebSocket, camera_id: str, client: str) -> None:
    logger.info(
        "WS branch selected | branch=publisher | camera_id=%s | client=%s",
        camera_id,
        client,
    )

    frame_count = 0
    fps_window: deque[float] = deque(maxlen=30)

    try:
        while True:
            bytes_data = await websocket.receive_bytes()
            frame_started_at = time.perf_counter()
            frame_count += 1

            if frame_count % 30 == 0:
                logger.info(
                    "WS publisher frames | camera_id=%s | frames=%s | client=%s",
                    camera_id,
                    frame_count,
                    client,
                )

            try:
                resultado = procesar_frame(bytes_data, camera_id, "ubicacion_ws")
                timestamp_ms = current_timestamp_ms()
                frame_w = int(resultado.get("frame_w", 0) or 0)
                frame_h = int(resultado.get("frame_h", 0) or 0)
                elapsed = max(1e-6, time.perf_counter() - frame_started_at)
                fps_window.append(1.0 / elapsed)
                fps = round(sum(fps_window) / len(fps_window), 1)

                detalles = resultado.get("detalles", [])
                if detalles and len(detalles) > 0:
                    logger.info(
                        "WS detections | camera_id=%s | total=%s | client=%s",
                        camera_id,
                        len(detalles),
                        client,
                    )

                    if ENABLE_DETECTION_PHOTO_UPLOAD:
                        java_service_url = os.getenv("JAVA_SERVICE_URL", "http://localhost:8080")
                        url_post_photo_bird = f"{java_service_url}/bird/photo_bird"

                        for deteccion in detalles:
                            payload = {
                                "probabilityYolo": deteccion.get("confianza", deteccion.get("confianza_detector", 0)),
                                "yoloLabel": deteccion.get("especie", "bird"),
                                "cameraId": camera_id,
                                "base64": deteccion.get("foto_base64", ""),
                                "takenAt": datetime.datetime.now().isoformat()
                            }

                            try:
                                def send_data(p=payload):
                                    return requests.post(url_post_photo_bird, json=p, timeout=5.0)

                                response = await asyncio.to_thread(send_data)
                                logger.info(
                                    "WS detection forwarded to Java | camera_id=%s | status=%s",
                                    camera_id,
                                    response.status_code,
                                )
                            except Exception as request_error:
                                logger.error(
                                    "WS forwarding error | camera_id=%s | error=%s",
                                    camera_id,
                                    str(request_error),
                                )
                    else:
                        logger.debug(
                            "WS detection photo upload disabled | camera_id=%s",
                            camera_id,
                        )

                    if get_viewer_count(camera_id) > 0:
                        frame_base64 = f"data:image/jpeg;base64,{base64.b64encode(bytes_data).decode('utf-8')}"
                        await broadcast_to_viewers(
                            camera_id,
                            {
                                "timestamp": timestamp_ms,
                                "frameBase64": frame_base64,
                                "detecciones": detalles,
                                "fps": fps,
                                "frame_w": frame_w,
                                "frame_h": frame_h,
                            },
                        )

                    await websocket.send_json(
                        {
                            "alerta": True,
                            "total": len(detalles),
                            "detecciones": detalles,
                            "fps": fps,
                            "frame_w": frame_w,
                            "frame_h": frame_h,
                        }
                    )
                else:
                    logger.debug(
                        "WS frame without detections | camera_id=%s | client=%s",
                        camera_id,
                        client,
                    )

                    if get_viewer_count(camera_id) > 0:
                        frame_base64 = f"data:image/jpeg;base64,{base64.b64encode(bytes_data).decode('utf-8')}"
                        await broadcast_to_viewers(
                            camera_id,
                            {
                                "timestamp": timestamp_ms,
                                "frameBase64": frame_base64,
                                "detecciones": [],
                                "fps": fps,
                                "frame_w": frame_w,
                                "frame_h": frame_h,
                            },
                        )

                    await websocket.send_json(
                        {
                            "alerta": False,
                            "total": 0,
                            "detecciones": [],
                            "fps": fps,
                            "frame_w": frame_w,
                            "frame_h": frame_h,
                        }
                    )

            except Exception as error:
                logger.error(
                    "WS frame processing error | camera_id=%s | error=%s",
                    camera_id,
                    str(error),
                    exc_info=True,
                )
                try:
                    await websocket.send_json({"error": "Error al procesar el frame"})
                except RuntimeError as send_error:
                    logger.debug(
                        "WS send error response failed | camera_id=%s | error=%s",
                        camera_id,
                        str(send_error),
                    )
                    break

    except WebSocketDisconnect:
        logger.info(
            "WS disconnected | branch=publisher | camera_id=%s | client=%s | frames=%s",
            camera_id,
            client,
            frame_count,
        )
    except Exception as error:
        logger.exception(
            "WS error | branch=publisher | camera_id=%s | client=%s | error=%s",
            camera_id,
            client,
            str(error),
        )
        await close_invalid_request(websocket, WS_CLOSE_STREAM_ERROR, "publisher_stream_error")
