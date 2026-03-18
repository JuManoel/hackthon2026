import logging
from fastapi import File, UploadFile, Form
from fastapi.responses import JSONResponse
from app.services.ml_service import procesar_frame, procesar_foto_chat_pipeline
from app.DTOs.analysis_dto import AnalisisResponseDTO

logger = logging.getLogger(__name__)

async def analizar_frame_controller(
    archivo: UploadFile,
    id_dispositivo: str = "Desconocido",
    ubicacion: str = "Desconocida"
):
    try:
        bytes_imagen = await archivo.read()
        
        # Llamar al servicio que hace la inferencia
        resultado = procesar_frame(bytes_imagen, id_dispositivo, ubicacion)
        
        return AnalisisResponseDTO(**resultado)
        
    except ValueError as ve:
        return JSONResponse(
            status_code=400,
            content={"error": str(ve)}
        )
    except Exception as e:
        logger.exception("Error procesando imagen")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error procesando imagen: {str(e)}"}
        )

async def analizar_foto_chat_controller(
    archivo: UploadFile
):
    """
    Controlador específico para el endpoint del chat,
    orientado a procesar una única foto subida por el usuario de la mejor forma.
    """
    try:
        bytes_imagen = await archivo.read()
        
        # Invocamos el pipeline especializado para imágenes de chat
        resultado = procesar_foto_chat_pipeline(bytes_imagen)
        
        return AnalisisResponseDTO(**resultado)
        
    except ValueError as ve:
        return JSONResponse(
            status_code=400,
            content={"error": str(ve)}
        )
    except Exception as e:
        logger.exception("Error procesando la foto del chat")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error procesando la foto: {str(e)}"}
        )
