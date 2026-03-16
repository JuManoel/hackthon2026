package edu.ucaldas.hackathon.DTOs.camera;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MonitoringCamerasDTO(
        LocalDateTime generatedAt,
        LocalDateTime windowStart,
        List<UUID> activeCameraIds) {
}
