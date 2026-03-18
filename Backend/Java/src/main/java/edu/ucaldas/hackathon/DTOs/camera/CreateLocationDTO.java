package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos para crear una nueva ubicación geográfica")
public record CreateLocationDTO(
    @NotBlank(message = "Region is required and cannot be blank")
    @Schema(description = "Región o departamento", example = "Caldas")
    String region,

    @NotBlank(message = "Address is required and cannot be blank")
    @Schema(description = "Dirección específica", example = "Calle 25 #18-42")
    String address,

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.00000000", message = "Latitude must be at least -90")
    @DecimalMax(value = "90.00000000", message = "Latitude must be at most 90")
    @Schema(description = "Latitud en grados (-90 a 90)", example = "5.0692")
    BigDecimal latitude,

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.00000000", message = "Longitude must be at least -180")
    @DecimalMax(value = "180.00000000", message = "Longitude must be at most 180")
    @Schema(description = "Longitud en grados (-180 a 180)", example = "-75.5149")
    BigDecimal longitude,

    @NotNull(message = "Height is required")
    @Schema(description = "Altura sobre el nivel del mar en metros", example = "1038.0")
    BigDecimal height
) {

}
