package edu.ucaldas.hackathon.DTOs.bird;

import java.math.BigDecimal;
import java.util.UUID;

import edu.ucaldas.hackathon.DTOs.camera.GetCameraDTO;
import edu.ucaldas.hackathon.DTOs.photo.GetPhotoDTO;
import edu.ucaldas.hackathon.DTOs.species.GetSpeciesDTO;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Información de un pájaro detectado")
public record GetBirdDTO(
    @Schema(description = "ID único del registro de pájaro")
    UUID id,
    @Schema(description = "Probabilidad de detección del modelo YOLO (0-1)", example = "0.95")
    BigDecimal probabilityYolo,
    @Schema(description = "Información de la especie del pájaro")
    GetSpeciesDTO species,
    @Schema(description = "Fotografía del pájaro")
    GetPhotoDTO photo,
    @Schema(description = "Cámara que detectó el pájaro")
    GetCameraDTO camera
) {

}
