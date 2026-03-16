package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;

public record UpdateCameraDTO(
    String name,
    BigDecimal angleXY,
    BigDecimal angleXZ,
    UpdateLocationDTO location
) {

}
