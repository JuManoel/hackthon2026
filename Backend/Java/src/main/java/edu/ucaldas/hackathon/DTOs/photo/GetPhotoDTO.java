package edu.ucaldas.hackathon.DTOs.photo;

import java.time.LocalDateTime;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Información de una fotografía de pájaro")
public record GetPhotoDTO(
    @Schema(description = "ID único de la fotografía")
    UUID id,
    @Schema(description = "URL o ruta de la fotografía", example = "https://cdn.example.com/photos/bird_001.jpg")
    String url,
    @Schema(description = "Fecha y hora en que se tomó la fotografía (ISO 8601)", example = "2026-03-15T10:30:00")
    LocalDateTime takenAt
) {

}
