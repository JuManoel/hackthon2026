# Hackthon 2026 - Monitoreo Inteligente de Aves

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-orange)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Arquitectura](https://img.shields.io/badge/arquitectura-monorepo-blue)

Proyecto colaborativo para detectar aves, monitorear cámaras en tiempo real y visualizar información desde una app web.

## Tecnologías destacadas
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-Backend-6DB33F?logo=springboot&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-IA%20%2B%20Streaming-009688?logo=fastapi&logoColor=white)
![YOLO](https://img.shields.io/badge/YOLO-Detecci%C3%B3n%20de%20aves-111111)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Base%20de%20datos-4169E1?logo=postgresql&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-black)
![OpenAI](https://img.shields.io/badge/OpenAI-Chat%20de%20apoyo-412991?logo=openai&logoColor=white)

## ¿Cómo está organizado?

### Frontend (`Frontend/`)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![STOMP](https://img.shields.io/badge/STOMP-Realtime-8A2BE2)
![Leaflet](https://img.shields.io/badge/Leaflet-Map-199900?logo=leaflet&logoColor=white)

App web donde el usuario interactúa con todo el sistema.

- Hecho con **React + TypeScript + Vite**.
- Incluye login/registro, vista de cámaras, mapa y chat.
- Se conecta al backend Java para datos de negocio.
- Se conecta al backend Python para transmisión en vivo y detecciones.

### Backend Java (`Backend/Java/`)
![Java](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.x-6DB33F?logo=springboot&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Security-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Persistence-4169E1?logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?logo=openai&logoColor=white)

Núcleo de la lógica de negocio.

- Hecho con **Spring Boot**.
- Maneja usuarios, cámaras, especies, aves y fotos.
- Controla autenticación y seguridad con JWT.
- Publica eventos en tiempo real para monitoreo.
- También integra el chat asistido (OpenAI) para preguntas sobre aves.

### Backend Python (`Backend/Python/`)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Streaming-009688?logo=fastapi&logoColor=white)
![YOLO](https://img.shields.io/badge/YOLO-Detección-111111)
![ResNet18](https://img.shields.io/badge/ResNet18-Clasificación-red)
![WebSocket](https://img.shields.io/badge/WebSocket-Video-black)

Módulo de inteligencia artificial y streaming.

- Hecho con **FastAPI**.
- Usa **YOLO + ResNet18** para detectar y clasificar aves.
- Recibe frames de cámara por WebSocket.
- Devuelve detecciones en tiempo real.
- Puede reenviar resultados al backend Java para persistencia.

## Flujo general (simple)
1. El frontend recibe video/detecciones y muestra el estado al usuario.
2. El backend Python analiza imágenes con IA.
3. El backend Java guarda y organiza la información del negocio.
4. PostgreSQL almacena los datos históricos.

## Ejecución rápida con Docker
```bash
docker compose up --build
```

Servicios principales:
- Frontend: `http://localhost:5173`
- Backend Java: `http://localhost:8080`
- Backend Python: `http://localhost:8000`

## Ejecución local por segmento (sin Docker)
### 1) Backend Java
```bash
cd Backend/Java
./mvnw spring-boot:run
```

En Windows PowerShell:
```powershell
cd Backend/Java
.\mvnw.cmd spring-boot:run
```

### 2) Backend Python
```bash
cd Backend/Python
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3) Frontend
```bash
cd Frontend
pnpm install
pnpm dev
```

## Variables de entorno
Usa `.env.example` como base. Además, estas variables están ligadas a `Backend/Java/src/main/resources/application.properties`.

### Variables generales (raíz `.env`)
```env
# Puertos / orquestación
JAVA_PORT_EXTERNAL=8080
PYTHON_PORT_EXTERNAL=8000
FRONTEND_PORT_EXTERNAL=5173

# Frontend
VITE_API_BASE_URL=http://localhost:8080
VITE_PYTHON_SERVICE_URL=http://localhost:8000

# Python backend
JAVA_SERVICE_URL=http://localhost:8080
SUPABASE_TABLE=avistamientos
ENABLE_DETECTION_PHOTO_UPLOAD=false
ENABLE_JAVA_BIRD_FORWARDING=true

# Java backend
JWT_SECRET=
BIRD_REALTIME_PERSIST=false
```

### Variables de `application.properties` (Backend Java)
```env
# OpenAI / chat
OPENAI_API_KEY=

# Base de datos
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# Config adicional
APP_TIMEZONE_OFFSET=-05:00
BIRD_REALTIME_PERSIST=false
```

Nota: en este proyecto varias variables tienen valores por defecto en `application.properties`, pero se recomienda definirlas explícitamente en `.env` para evitar inconsistencias entre entornos.

## Licencia
Proyecto bajo licencia **MIT**. Ver `LICENSE`.
