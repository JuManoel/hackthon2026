package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Información de ubicación geográfica")
public record GetLocationDTO(
    @Schema(description = "Región o departamento", example = "Caldas")
    String region,
    @Schema(description = "Dirección específica", example = "Calle 25 #18-42")
    String address,
    @Schema(description = "Latitud en grados (-90 a 90)", example = "5.0692")
    BigDecimal latitude,
    @Schema(description = "Longitud en grados (-180 a 180)", example = "-75.5149")
    BigDecimal longitude,
    @Schema(description = "Altura sobre el nivel del mar en metros", example = "1038.0")
    BigDecimal height
) {

}
