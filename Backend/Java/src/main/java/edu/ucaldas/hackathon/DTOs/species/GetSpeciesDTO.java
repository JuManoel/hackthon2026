package edu.ucaldas.hackathon.DTOs.species;

import java.util.UUID;

public record GetSpeciesDTO(
    UUID id,
    String popularName,
    String scientificName,
    String yoloLabel
) {

}
