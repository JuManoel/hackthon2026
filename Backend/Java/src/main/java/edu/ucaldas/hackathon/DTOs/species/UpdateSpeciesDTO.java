package edu.ucaldas.hackathon.DTOs.species;

import jakarta.validation.constraints.NotBlank;

public record UpdateSpeciesDTO(
    @NotBlank(message = "Popular name is required and cannot be blank")
    String popularName,

    @NotBlank(message = "Scientific name is required and cannot be blank")
    String scientificName,

    @NotBlank(message = "YOLO label is required and cannot be blank")
    String yoloLabel
) {

}
