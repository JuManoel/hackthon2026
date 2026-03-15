package edu.ucaldas.hackathon.DTOs.bird;

import java.math.BigDecimal;
import java.util.UUID;

import edu.ucaldas.hackathon.DTOs.camara.GetCamaraDTO;

public record GetBirdDTO(
    UUID id,
    BigDecimal probabilityYolo,
    GetSpeciesDTO species,
    GetPhotoDTO photo,
    GetCamaraDTO camara
) {
    
}
