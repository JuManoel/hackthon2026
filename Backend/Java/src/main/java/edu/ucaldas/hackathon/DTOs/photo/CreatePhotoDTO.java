package edu.ucaldas.hackathon.DTOs.photo;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos para crear una nueva fotografía")
public record CreatePhotoDTO(
    @NotBlank(message = "URL is required and cannot be blank")
    @Schema(description = "URL o ruta de la fotografía", example = "https://cdn.example.com/photos/bird_001.jpg")
    String url,

    @NotNull(message = "TakenAt date is required")
    @Schema(description = "Fecha y hora en que se tomó la fotografía (ISO 8601)", example = "2026-03-15T10:30:00")
    LocalDateTime takenAt
) {

}
