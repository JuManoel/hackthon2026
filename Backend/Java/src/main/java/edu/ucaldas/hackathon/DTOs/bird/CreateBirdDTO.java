package edu.ucaldas.hackathon.DTOs.bird;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos para crear un nuevo registro de pájaro detectado")
public record CreateBirdDTO(
    @NotNull(message = "Probability is required")
    @DecimalMin(value = "0.00", message = "Probability must be at least 0.00")
    @DecimalMax(value = "100.00", message = "Probability must be at most 100.00")
    @Schema(description = "Probabilidad de detección del modelo YOLO (0-100)", example = "95.5")
    BigDecimal probabilityYolo,

    @NotBlank(message = "Species ID is required and cannot be blank")
    @Schema(description = "ID de la especie detectada")
    String speciesId,

    @NotBlank(message = "Photo ID is required and cannot be blank")
    @Schema(description = "ID de la fotografía de la detección")
    String photoId,

    @NotBlank(message = "Camera ID is required and cannot be blank")
    @Schema(description = "ID de la cámara que realizó la detección")
    String cameraId
) {

}
