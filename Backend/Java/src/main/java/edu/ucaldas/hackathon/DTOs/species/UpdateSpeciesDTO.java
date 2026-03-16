package edu.ucaldas.hackathon.DTOs.species;

import jakarta.validation.constraints.NotBlank;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos para actualizar una especie existente")
public record UpdateSpeciesDTO(
    @NotBlank(message = "Popular name is required and cannot be blank")
    @Schema(description = "Nombre común de la especie", example = "Colibrí chulco")
    String popularName,

    @NotBlank(message = "Scientific name is required and cannot be blank")
    @Schema(description = "Nombre científico de la especie", example = "Trochilus scutatus")
    String scientificName,

    @NotBlank(message = "YOLO label is required and cannot be blank")
    @Schema(description = "Etiqueta del modelo YOLO para detección", example = "hummingbird_001")
    String yoloLabel
) {

}
