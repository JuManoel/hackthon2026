package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos para crear una nueva cámara de monitoreo")
public record CreateCameraDTO(
    @NotBlank(message = "Name is required and cannot be blank")
    @Schema(description = "Nombre de la cámara", example = "Cámara Noreste")
    String name,

    @NotNull(message = "Angle XY is required")
    @DecimalMin(value = "0.00", message = "Angle XY must be at least 0.00")
    @DecimalMax(value = "360.00", message = "Angle XY must be at most 360.00")
    @Schema(description = "Ángulo XY en grados (0-360)", example = "45.5")
    BigDecimal angleXY,

    @NotNull(message = "Angle XZ is required")
    @DecimalMin(value = "0.00", message = "Angle XZ must be at least 0.00")
    @DecimalMax(value = "360.00", message = "Angle XZ must be at most 360.00")
    @Schema(description = "Ángulo XZ en grados (0-360)", example = "30.0")
    BigDecimal angleXZ,

    @NotNull(message = "Location is required")
    @Valid
    @Schema(description = "Información de ubicación de la cámara")
    CreateLocationDTO location
) {

}
