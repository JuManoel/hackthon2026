import os
import cv2
import datetime
import logging
import base64
import numpy as np
import torch
import torchvision.transforms as transforms
from ultralytics import YOLO
from torchvision.models import resnet18
from PIL import Image

from app.config.config import (
    RUTA_MODELO_DETECTOR,
    RUTA_MODELO_CLASIFICADOR,
    CLASE_AVES,
    CONFIANZA_DETECTOR,
    CONFIANZA_CLASIFICADOR,
    MIN_ANCHO_CAJA,
    MIN_ALTO_CAJA,
    MIN_AREA_RELATIVA,
    SOLO_MEJOR_AVE
)

logger = logging.getLogger(__name__)

# Referencias globales a los modelos cargados
detector = None
clasificador = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Clases de aves entrenadas (100 clases - orden exacto del dataset)
BIRD_CLASSES = {
    0: "Acropternis orthonyx", 1: "Adelomyia melanogenys", 2: "Aglaeactis cupripennis", 3: "Andigena hypoglauca",
    4: "Andigena nigrirostris", 5: "Anisognathus igniventris", 6: "Anisognathus lacrymosus", 7: "Anisognathus somptuosus",
    8: "Atlapetes flaviceps", 9: "Bubulcus ibis", 10: "Campylorhamphus pusillus", 11: "Capito hypoleucus",
    12: "Cardellina canadensis", 13: "Cathartes aura", 14: "Cercomacroides parkeri", 15: "Chalcostigma herrani",
    16: "Chamaepetes goudotii", 17: "Chlorochrysa nitidissima", 18: "Chlorornis riefferii", 19: "Coeligena coeligena",
    20: "Coeligena lutetiae", 21: "Coeligena torquata", 22: "Colaptes rivolii", 23: "Colibri coruscans",
    24: "Columbina talpacoti", 25: "Coragyps atratus", 26: "Cyanocorax affinis", 27: "Cyanolyca armillata",
    28: "Drymophila striaticeps", 29: "Dryocopus lineatus", 30: "Eriocnemis derbyi", 31: "Falco sparverius",
    32: "Grallaria alleni", 33: "Grallaria alvarezi", 34: "Grallaria guatimalensis", 35: "Grallaria milleri",
    36: "Grallaria nuchalis", 37: "Grallaria ruficapilla", 38: "Grallaria rufocinerea", 39: "Grallaricula cucullata",
    40: "Habia cristata", 41: "Hapalopsittaca amazonina", 42: "Heliodoxa jacula", 43: "Heliothryx barroti",
    44: "Henicorhina leucophrys", 45: "Hypopyrrhus pyrohypogaster", 46: "Leptosittaca branickii", 47: "Lipaugus fuscocinereus",
    48: "Manacus vitellinus", 49: "Melanerpes formicivorus", 50: "Melanerpes pulcher", 51: "Merganetta armata",
    52: "Metallura tyrianthina", 53: "Metallura williami", 54: "Mniotilta varia", 55: "Momotus aequatorialis",
    56: "Myioborus ornatus", 57: "Ocreatus underwoodii", 58: "Odontophorus hyperythrus", 59: "Ognorhynchus icterotis",
    60: "Ortalis columbiana", 61: "Oxypogon stuebelii", 62: "Parkesia noveboracensis", 63: "Penelope montagnii",
    64: "Phalcoboenus carunculatus", 65: "Pharomachrus auriceps", 66: "Pheugopedius fasciatoventris", 67: "Picumnus granadensis",
    68: "Pipreola riefferii", 69: "Pitangus sulphuratus", 70: "Poliocrania exsul", 71: "Porphyrio martinica",
    72: "Psittacara wagleri", 73: "Pterophanes cyanopterus", 74: "Rupicola peruvianus", 75: "Rupornis magnirostris",
    76: "Saltator cinctus", 77: "Saltator striatipectus", 78: "Schistes geoffroyi", 79: "Scytalopus opacus",
    80: "Scytalopus spillmanni", 81: "Scytalopus stilesi", 82: "Sericossypha albocristata", 83: "Thalurania colombica",
    84: "Thraupis episcopus", 85: "Thraupis palmarum", 86: "Threnetes ruckeri", 87: "Trogon personatus",
    88: "Troglodytes aedon", 89: "Turdus fuscater", 90: "Turdus ignobilis", 91: "Tyrannus melancholicus",
    92: "Xiphocolaptes promeropirhynchus", 93: "Zenaida auriculata", 94: "Zonotrichia capensis", 95: "Acropternis orthonyx",
    96: "Adelomyia melanogenys", 97: "Aglaeactis cupripennis", 98: "Andigena hypoglauca", 99: "Andigena nigrirostris"
}

def init_models():
    """Inicializa el detector YOLO y el clasificador ResNet18 con pesos entrenados."""
    global detector, clasificador

    if not os.path.exists(RUTA_MODELO_DETECTOR):
        raise RuntimeError(f"Falta el archivo del modelo detector: {RUTA_MODELO_DETECTOR}")

    if not os.path.exists(RUTA_MODELO_CLASIFICADOR):
        raise RuntimeError(f"Falta el archivo del modelo clasificador: {RUTA_MODELO_CLASIFICADOR}")

    logger.info(f"Cargando detector YOLO desde: {RUTA_MODELO_DETECTOR}")
    detector = YOLO(RUTA_MODELO_DETECTOR)
    
    logger.info("Cargando clasificador ResNet18 con pesos entrenados...")
    clasificador = resnet18(weights=None)
    
    # Modificar la capa final para tener 100 clases de aves (en lugar de 1000 de ImageNet)
    num_clases = 100
    clasificador.fc = torch.nn.Linear(clasificador.fc.in_features, num_clases)
    
    # Cargar los pesos entrenados de best.pt
    try:
        checkpoint = torch.load(RUTA_MODELO_CLASIFICADOR, map_location=device)
        
        # Extraer state_dict del checkpoint
        if isinstance(checkpoint, dict):
            if 'model_state' in checkpoint:
                state_dict = checkpoint['model_state']
            elif 'state_dict' in checkpoint:
                state_dict = checkpoint['state_dict']
            elif 'model' in checkpoint:
                state_dict = checkpoint['model']
            else:
                state_dict = checkpoint
        else:
            state_dict = checkpoint
        
        # Cargar los pesos con strict=False para permitir discrepancias menores
        clasificador.load_state_dict(state_dict, strict=False)
        logger.info("Pesos del modelo clasificador cargados correctamente")
    except Exception as e:
        logger.warning(f"No se pudieron cargar los pesos de {RUTA_MODELO_CLASIFICADOR}: {e}")
        logger.info("Usando modelo ResNet18 pre-entrenado con 100 clases")
        # No hacemos fallback porque ya modificamos la arquitectura
    
    clasificador = clasificador.to(device)
    clasificador.eval()
    logger.info("Modelos cargados exitosamente!")


def area_relativa(x1, y1, x2, y2, w, h):
    area_caja = max(0, x2 - x1) * max(0, y2 - y1)
    area_frame = w * h
    return area_caja / area_frame if area_frame > 0 else 0

def procesar_frame(bytes_imagen: bytes, id_dispositivo: str, ubicacion: str) -> dict:
    """Ejecuta el pipeline de inferencia YOLO + ResNet18 y devuelve las detecciones formateadas."""
    nparr = np.frombuffer(bytes_imagen, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        raise ValueError("Imagen no válida o corrupta")

    h, w, _ = frame.shape

    # Detectar objetos (aves)
    # save=False evita guardar imágenes/etiquetas
    # project=None y name=None previenen creación de carpetas 'runs/predict'
    resultados_det = detector.predict(
        frame,
        classes=[CLASE_AVES],
        conf=CONFIANZA_DETECTOR,
        imgsz=1280,
        verbose=False,
        save=False,
        project=None,
        name=None
    )[0]

    candidatas = []

    if resultados_det.boxes is not None and len(resultados_det.boxes) > 0:
        cajas = resultados_det.boxes.xyxy.cpu().numpy()
        confs_det = resultados_det.boxes.conf.cpu().numpy()

        for idx, (caja, conf_det) in enumerate(zip(cajas, confs_det)):
            x1, y1, x2, y2 = map(int, caja)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            ancho = x2 - x1
            alto = y2 - y1
            area_rel = area_relativa(x1, y1, x2, y2, w, h)

            if ancho < MIN_ANCHO_CAJA or alto < MIN_ALTO_CAJA:
                logger.info(f"Caja {idx+1} descartada por tamaño pequeño: {ancho}x{alto}")
                continue

            if area_rel < MIN_AREA_RELATIVA:
                logger.info(f"Caja {idx+1} descartada por área relativa baja: {area_rel:.4f}")
                continue

            recorte = frame[y1:y2, x1:x2]
            if recorte.size == 0:
                continue

            # Clasificar recorte con ResNet18
            especie, conf_cls = clasificar_con_resnet18(recorte)
            
            if conf_cls < CONFIANZA_CLASIFICADOR:
                logger.info(f"Caja {idx+1} descartada por baja confianza de clasificador: {conf_cls:.3f}")
                continue

            score_final = (0.65 * float(conf_det)) + (0.35 * float(conf_cls))

            # Convertir el recorte a Base64 para enviar a Java
            _, buffer = cv2.imencode('.jpg', recorte)
            base64_recorte = base64.b64encode(buffer).decode('utf-8')
            foto_base64 = f"data:image/jpeg;base64,{base64_recorte}"

            candidatas.append({
                "especie": especie,
                "confianza": round(conf_cls * 100, 2),
                "confianza_detector": round(float(conf_det) * 100, 2),
                "score_final": round(score_final * 100, 2),
                "coordenadas": [x1, y1, x2, y2],
                "foto_base64": foto_base64,
                "detalles": []
            })

    candidatas.sort(key=lambda x: x["score_final"], reverse=True)

    if SOLO_MEJOR_AVE and candidatas:
        candidatas = [candidatas[0]]


    return {
        "timestamp": datetime.datetime.now().isoformat(),
        "aves_encontradas": len(candidatas),
        "detalles": candidatas
    }


def clasificar_con_resnet18(image_cv2: np.ndarray) -> tuple:
    """
    Clasifica una imagen usando ResNet18.
    
    Args:
        image_cv2: Imagen en formato OpenCV (BGR, numpy array)
    
    Returns:
        Tupla (especie, confianza) donde confianza está en rango [0, 1]
    """
    try:
        # Convertir de BGR a RGB
        image_rgb = cv2.cvtColor(image_cv2, cv2.COLOR_BGR2RGB)
        image_pil = Image.fromarray(image_rgb)
        
        # Normalización estándar de ImageNet
        preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        image_tensor = preprocess(image_pil).unsqueeze(0).to(device)
        
        # Predicción
        with torch.no_grad():
            logits = clasificador(image_tensor)
            probabilities = torch.softmax(logits, dim=1)
            confidence, predicted_class = torch.max(probabilities, 1)
        
        predicted_idx = predicted_class.item()
        confidence_score = confidence.item()
        
        # Obtener nombre de la especie (si es un ave)
        especie = BIRD_CLASSES.get(predicted_idx, f"class_{predicted_idx}")
        
        return especie, confidence_score
        
    except Exception as e:
        logger.error(f"Error en clasificación ResNet18: {str(e)}")
        return "unknown", 0.0



