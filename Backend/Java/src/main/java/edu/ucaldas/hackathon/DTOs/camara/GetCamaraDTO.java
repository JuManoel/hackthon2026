package edu.ucaldas.hackathon.DTOs.camara;

import java.math.BigDecimal;
import java.util.UUID;

public record GetCamaraDTO(
    UUID id,
    String name,
    BigDecimal angleXY,
    BigDecimal angleXZ,
    GetLocationDTO location
) {
    
}
