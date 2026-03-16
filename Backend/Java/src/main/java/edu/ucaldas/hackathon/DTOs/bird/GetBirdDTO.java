package edu.ucaldas.hackathon.DTOs.bird;

import java.math.BigDecimal;
import java.util.UUID;

import edu.ucaldas.hackathon.DTOs.camera.GetCameraDTO;

public record GetBirdDTO(
    UUID id,
    BigDecimal probabilityYolo,
    GetSpeciesDTO species,
    GetPhotoDTO photo,
    GetCameraDTO camera
) {

}
