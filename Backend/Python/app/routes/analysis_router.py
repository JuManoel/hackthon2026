from fastapi import APIRouter, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from app.controllers.analysis_controller import analizar_frame_controller
from app.DTOs.analysis_dto import AnalisisResponseDTO
from app.services.ml_service import procesar_frame
import requests
import asyncio
import logging
import os
import datetime

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Análisis de Aves"]
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
async def video_stream(websocket: WebSocket, id_dispositivo: str = "Desconocido", camera_id: str = ""):
    """
    Endpoint de WebSocket para recibir frames de video en tiempo real desde el frontend.
    Si se detectan aves, se realiza un POST al backend de Java para emitir el broadcast.
    """
    await websocket.accept()
    connection_active = True
    
    try:
        while connection_active:
            try:
                # 1. Recibir frame en bytes desde el frontend
                bytes_data = await websocket.receive_bytes()
                
                # 2. Procesar frame con YOLO
                try:
                    # Utiliza procesar_frame internamente
                    resultado = procesar_frame(bytes_data, id_dispositivo, "ubicacion_ws")
                    
                    # 3. Si se detectaron aves
                    detalles = resultado.get("detalles", [])
                    if detalles and len(detalles) > 0:
                        java_service_url = os.getenv("JAVA_SERVICE_URL", "http://localhost:8080")
                        url_post_photo_bird = f"{java_service_url}/bird/photo_bird"

                        import asyncio
                        import requests

                        # Iterar por cada ave detectada en lugar de enviar solo la primera
                        for deteccion in detalles:
                            # 1. Enviar los datos combinados en un solo DTO
                            payload = {
                                "probabilityYolo": deteccion.get("confianza", deteccion.get("confianza_detector", 0)),
                                "yoloLabel": deteccion.get("especie", "bird"),
                                "cameraId": camera_id,
                                "base64": deteccion.get("foto_base64", ""),
                                "takenAt": datetime.datetime.now().isoformat()
                            }

                            # Hacer POST a Java de manera asíncrona
                            try:
                                def send_data(p=payload):
                                    return requests.post(url_post_photo_bird, json=p, timeout=5.0)
                                
                                resp = await asyncio.to_thread(send_data)
                                logger.info(f"Detección y Foto enviada a Java unificada -> Estado final: {resp.status_code}")
                                    
                            except Exception as req_err:
                                logger.error(f"Error al enviar a Java: {req_err}")
                            
                        # 5. Informar al frontend que hubo detección (opcional)
                        if connection_active:
                            await websocket.send_json({"alerta": True, "detecciones": detalles})
                    else:
                        # Informamos que no hay nada
                        if connection_active:
                            await websocket.send_json({"alerta": False, "detecciones": []})

                except Exception as e:
                    logger.error(f"Error procesando frame: {e}", exc_info=True)
                    if connection_active:
                        try:
                            await websocket.send_json({"error": "Error al procesar el frame"})
                        except RuntimeError as send_err:
                            logger.debug(f"No se pudo enviar error al cliente: {send_err}")
                            connection_active = False
                    
            except WebSocketDisconnect:
                connection_active = False
                logger.info(f"Cliente desconectado del stream websocket {id_dispositivo}")
            except RuntimeError as ws_err:
                connection_active = False
                logger.error(f"Error de conexión WebSocket: {ws_err}")
                
    except Exception as e:
        logger.error(f"Error inesperado en websocket: {e}", exc_info=True)
    finally:
        if connection_active:
            try:
                await websocket.close()
            except RuntimeError:
                pass

