package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;
import java.util.UUID;

public record GetCameraDTO(
    UUID id,
    String name,
    BigDecimal angleXY,
    BigDecimal angleXZ,
    GetLocationDTO location
) {

}
