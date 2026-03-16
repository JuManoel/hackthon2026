package edu.ucaldas.hackathon.DTOs.bird;

import java.util.UUID;

public record GetSpeciesDTO(
    UUID id,
    String popularName,
    String scientificName,
    String yoloLabel
) {
    
}
