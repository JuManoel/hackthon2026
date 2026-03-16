package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;

public record CreateCameraDTO(
    String name,
    BigDecimal angleXY,
    BigDecimal angleXZ,
    CreateLocationDTO location

) {

}
