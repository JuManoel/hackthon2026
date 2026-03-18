from pydantic import BaseModel, Field
from typing import List, Optional

class EspecieDetalle(BaseModel):
    especie: str
    confianza: float
    confianza_detector: float
    score_final: float
    coordenadas: List[int]
    foto_base64: Optional[str] = None
    detalles: Optional[List] = []

class AnalisisResponseDTO(BaseModel):
    timestamp: str
    aves_encontradas: int
    detalles: List[EspecieDetalle]
