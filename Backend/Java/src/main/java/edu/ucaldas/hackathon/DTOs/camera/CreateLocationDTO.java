package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateLocationDTO(
    @NotBlank(message = "Region is required and cannot be blank")
    String region,

    @NotBlank(message = "Address is required and cannot be blank")
    String address,

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.00000000", message = "Latitude must be at least -90")
    @DecimalMax(value = "90.00000000", message = "Latitude must be at most 90")
    BigDecimal latitude,

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.00000000", message = "Longitude must be at least -180")
    @DecimalMax(value = "180.00000000", message = "Longitude must be at most 180")
    BigDecimal longitude,

    @NotNull(message = "Height is required")
    BigDecimal height
) {

}
