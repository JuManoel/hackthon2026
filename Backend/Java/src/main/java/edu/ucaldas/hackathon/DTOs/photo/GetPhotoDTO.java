package edu.ucaldas.hackathon.DTOs.photo;

import java.time.LocalDateTime;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Información de una fotografía de pájaro")
public record GetPhotoDTO(
        @Schema(description = "ID único de la fotografía") UUID id,
        @Schema(description = "Imagen codificada en base64", example = "data:image/jpeg;base64,/9j/4AAQSkZJRg...") String base64,
        @Schema(description = "Fecha y hora en que se tomó la fotografía (ISO 8601)", example = "2026-03-15T10:30:00") LocalDateTime takenAt) {

}
