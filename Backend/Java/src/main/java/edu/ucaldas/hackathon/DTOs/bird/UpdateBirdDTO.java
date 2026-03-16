package edu.ucaldas.hackathon.DTOs.bird;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateBirdDTO(
    @NotNull(message = "Probability is required")
    @DecimalMin(value = "0.00", message = "Probability must be at least 0.00")
    @DecimalMax(value = "100.00", message = "Probability must be at most 100.00")
    BigDecimal probabilityYolo,

    @NotBlank(message = "Species ID is required and cannot be blank")
    String speciesId,

    @NotBlank(message = "Photo ID is required and cannot be blank")
    String photoId,

    @NotBlank(message = "Camera ID is required and cannot be blank")
    String cameraId
) {

}
