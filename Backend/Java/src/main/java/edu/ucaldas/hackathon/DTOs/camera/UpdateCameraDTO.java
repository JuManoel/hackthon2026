package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateCameraDTO(
    @NotBlank(message = "Name is required and cannot be blank")
    String name,

    @NotNull(message = "Angle XY is required")
    @DecimalMin(value = "0.00", message = "Angle XY must be at least 0.00")
    @DecimalMax(value = "360.00", message = "Angle XY must be at most 360.00")
    BigDecimal angleXY,

    @NotNull(message = "Angle XZ is required")
    @DecimalMin(value = "0.00", message = "Angle XZ must be at least 0.00")
    @DecimalMax(value = "360.00", message = "Angle XZ must be at most 360.00")
    BigDecimal angleXZ,

    @NotNull(message = "Location is required")
    @Valid
    UpdateLocationDTO location
) {

}
