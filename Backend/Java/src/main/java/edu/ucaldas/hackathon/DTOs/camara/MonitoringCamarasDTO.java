package edu.ucaldas.hackathon.DTOs.camara;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MonitoringCamarasDTO(
        LocalDateTime generatedAt,
        LocalDateTime windowStart,
        List<UUID> activeCamaraIds) {
}
