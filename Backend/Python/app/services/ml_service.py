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
    0: 'Acropternis orthonyx', 1: 'Adelomyia melanogenys', 2: 'Aglaeactis cupripennis', 3: 'Andigena hypoglauca', 
    4: 'Andigena nigrirostris', 5: 'Anisognathus igniventris', 6: 'Anisognathus lacrymosus', 7: 'Anisognathus somptuosus', 
    8: 'Atlapetes flaviceps', 9: 'Bubulcus ibis', 10: 'Butorides striata', 11: 'Campephilus pollens', 
    12: 'Campylorhamphus pusillus', 13: 'Capito hypoleucus', 14: 'Cardellina canadensis', 15: 'Cathartes aura', 
    16: 'Cercomacroides parkeri', 17: 'Chalcostigma herrani', 18: 'Chamaepetes goudotii', 19: 'Chlorochrysa nitidissima', 
    20: 'Chlorornis riefferii', 21: 'Coeligena coeligena', 22: 'Coeligena lutetiae', 23: 'Coeligena torquata', 
    24: 'Colaptes rivolii', 25: 'Colibri coruscans', 26: 'Columbina talpacoti', 27: 'Coragyps atratus', 
    28: 'Cyanocorax affinis', 29: 'Cyanolyca armillata', 30: 'Drymophila striaticeps', 31: 'Dryocopus lineatus', 
    32: 'Dubusia taeniata', 33: 'Elanus leucurus', 34: 'Eriocnemis derbyi', 35: 'Falco sparverius', 
    36: 'Grallaria alleni', 37: 'Grallaria alvarezi', 38: 'Grallaria guatimalensis', 39: 'Grallaria milleri', 
    40: 'Grallaria nuchalis', 41: 'Grallaria ruficapilla', 42: 'Grallaria rufocinerea', 43: 'Grallaricula cucullata', 
    44: 'Habia cristata', 45: 'Hapalopsittaca amazonina', 46: 'Heliodoxa jacula', 47: 'Heliothryx barroti', 
    48: 'Henicorhina leucophrys', 49: 'Hypopyrrhus pyrohypogaster', 50: 'Leptosittaca branickii', 51: 'Lipaugus fuscocinereus', 
    52: 'Manacus vitellinus', 53: 'Melanerpes formicivorus', 54: 'Melanerpes pulcher', 55: 'Merganetta armata', 
    56: 'Metallura tyrianthina', 57: 'Metallura williami', 58: 'Mniotilta varia', 59: 'Momotus aequatorialis', 
    60: 'Myioborus ornatus', 61: 'Ocreatus underwoodii', 62: 'Odontophorus hyperythrus', 63: 'Ognorhynchus icterotis', 
    64: 'Ortalis columbiana', 65: 'Oxypogon stuebelii', 66: 'Parkesia noveboracensis', 67: 'Penelope montagnii', 
    68: 'Phalcoboenus carunculatus', 69: 'Pharomachrus auriceps', 70: 'Pheugopedius fasciatoventris', 71: 'Picumnus granadensis', 
    72: 'Pipreola riefferii', 73: 'Pitangus sulphuratus', 74: 'Poliocrania exsul', 75: 'Porphyrio martinica', 
    76: 'Psittacara wagleri', 77: 'Pterophanes cyanopterus', 78: 'Rupicola peruvianus', 79: 'Rupornis magnirostris', 
    80: 'Saltator cinctus', 81: 'Saltator striatipectus', 82: 'Schistes geoffroyi', 83: 'Scytalopus opacus', 
    84: 'Scytalopus spillmanni', 85: 'Scytalopus stilesi', 86: 'Sericossypha albocristata', 87: 'Setophaga cerulea', 
    88: 'Thalurania colombica', 89: 'Thraupis episcopus', 90: 'Thraupis palmarum', 91: 'Threnetes ruckeri', 
    92: 'Troglodytes aedon', 93: 'Trogon personatus', 94: 'Turdus fuscater', 95: 'Turdus ignobilis', 
    96: 'Tyrannus melancholicus', 97: 'Xiphocolaptes promeropirhynchus', 98: 'Zenaida auriculata', 99: 'Zonotrichia capensis'
}

def init_models():
    """Inicializa el detector YOLO y el clasificador ResNet18 con pesos entrenados."""
    global detector, clasificador

    # En entornos de desarrollo/hackathon a veces los pesos no se incluyen en el repo.
    # Preferimos levantar el servicio con fallbacks razonables en vez de fallar al iniciar.
    if os.path.exists(RUTA_MODELO_DETECTOR):
        logger.info(f"Cargando detector YOLO desde: {RUTA_MODELO_DETECTOR}")
        detector = YOLO(RUTA_MODELO_DETECTOR)
    else:
        fallback_detector = "yolo11n.pt"
        logger.warning(
            "No se encontró el modelo detector en '%s'. Usando fallback '%s' (se descargará si hace falta).",
            RUTA_MODELO_DETECTOR,
            fallback_detector,
        )
        detector = YOLO(fallback_detector)
    
    logger.info("Cargando clasificador ResNet18 con pesos entrenados...")
    clasificador = resnet18(weights=None)
    
    # Modificar la capa final para tener 100 clases de aves (en lugar de 1000 de ImageNet)
    num_clases = 100
    clasificador.fc = torch.nn.Linear(clasificador.fc.in_features, num_clases)
    
    # Cargar los pesos entrenados del clasificador si están disponibles.
    if not os.path.exists(RUTA_MODELO_CLASIFICADOR):
        logger.warning(
            "No se encontró el modelo clasificador en '%s'. El clasificador quedará sin pesos entrenados.",
            RUTA_MODELO_CLASIFICADOR,
        )
    else:
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
            logger.warning("No se pudieron cargar los pesos de '%s': %s", RUTA_MODELO_CLASIFICADOR, e)
            # Nos quedamos con el modelo inicializado (sin pesos entrenados).
    
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
    logger.debug(f"Frame recibido: {w}x{h} desde {id_dispositivo}")

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
    
    logger.debug(f"YOLO detectó {len(resultados_det.boxes) if resultados_det.boxes is not None else 0} cajas")

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
        "frame_w": w,
        "frame_h": h,
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



