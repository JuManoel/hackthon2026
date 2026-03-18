"""
Archivo de configuración para el microservicio de detección de aves.
Modifica aquí los parámetros sin tocar el código principal.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Obtenemos la ruta base del proyecto (Backend/Python)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ============= CONFIGURACIÓN DEL SERVIDOR =============

# Ruta de los modelos YOLO
RUTA_MODELO_DETECTOR = os.path.join(BASE_DIR, "weights", "yolo26n.pt")
RUTA_MODELO_CLASIFICADOR = os.path.join(BASE_DIR, "weights", "best.pt")

# Parámetros de detección
CLASE_AVES = 14  # COCO dataset: 14 = bird
CONFIANZA_DETECTOR = 0.05  # Rango: 0.0 - 1.0 (0% - 100%)
CONFIANZA_CLASIFICADOR = 0.40
MIN_ANCHO_CAJA = 20
MIN_ALTO_CAJA = 20
MIN_AREA_RELATIVA = 0.0001   # 0.01% del frame

# Test-Time Augmentation para clasificación más precisa
USE_TTA_CHAT = True  # True = más preciso pero más lento (recomendado para chat)
USE_TTA_VIDEO = False  # False = más rápido (recomendado para video en tiempo real)

# Configuración de cuántas aves devolver
# True = solo devolver el ave con mayor confianza
# False = devolver todas las aves detectadas que superen el umbral de confianza
SOLO_MEJOR_AVE_CHAT = True   # Para chat: devuelve solo la mejor
SOLO_MEJOR_AVE_VIDEO = False  # Para video: devuelve todas las detectadas

# ============= CONFIGURACIÓN SUPABASE =============

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "avistamientos") # Nombre de la tabla por defecto

# Puerto del servidor
PUERTO_SERVIDOR = 8000
HOST_SERVIDOR = "127.0.0.1"  # Cambiar a "0.0.0.0" para acceso remoto

# ============= CONFIGURACIÓN DEL CLIENTE =============

# URL del servidor API
URL_SERVIDOR = "http://127.0.0.1:8000"
ENDPOINT_ANALISIS = "/analizar_frame"
URL_API_COMPLETA = URL_SERVIDOR + ENDPOINT_ANALISIS

# Índice de la cámara (0 = cámara por defecto)
INDICE_CAMARA = 0

# Intervalo de envío (en segundos)
INTERVALO_FRAMES = 1

# Mostrar la cámara localmente
MOSTRAR_CAMARA_LOCAL = True

# ============= CONFIGURACIÓN AVANZADA =============

# Métodos de prerocesamiento
RESIZE_FRAME = False
RESIZE_WIDTH = 640
RESIZE_HEIGHT = 480

# Debug
DEBUG = True
VERBOSE_API = False

# ============= RESPUESTA ESPERADA =============
"""
Cuando la API detecta aves, devuelve un JSON como este:

{
    "timestamp": "2026-03-14T12:34:56.789123",
    "aves_encontradas": 2,
    "detalles": [
        {
            "especie": "house_sparrow",
            "confianza": 95.42,
            "coordenadas": [120, 150, 300, 400]
        },
        {
            "especie": "common_pigeon",
            "confianza": 87.23,
            "coordenadas": [350, 200, 550, 450]
        }
    ]
}
"""
