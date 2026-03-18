package edu.ucaldas.hackathon.DTOs.species;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Información de una especie de pájaro")
public record GetSpeciesDTO(
    @Schema(description = "ID único de la especie")
    UUID id,
    @Schema(description = "Nombre común de la especie", example = "Colibrí chulco")
    String popularName,
    @Schema(description = "Nombre científico de la especie", example = "Trochilus scutatus")
    String scientificName,
    @Schema(description = "Etiqueta del modelo YOLO para detección", example = "hummingbird_001")
    String yoloLabel
) {

}
