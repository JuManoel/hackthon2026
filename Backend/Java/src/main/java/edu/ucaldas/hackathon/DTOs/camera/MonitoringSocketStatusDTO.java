package edu.ucaldas.hackathon.DTOs.camera;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Estado actual del monitoreo en tiempo real via WebSocket")
public record MonitoringSocketStatusDTO(
        @Schema(description = "Indica si hay suscriptores activos conectados", example = "true")
        boolean hasActiveSubscribers,
        @Schema(description = "Cantidad de suscripciones activas", example = "3")
        int activeSubscriptionsCount) {
}
