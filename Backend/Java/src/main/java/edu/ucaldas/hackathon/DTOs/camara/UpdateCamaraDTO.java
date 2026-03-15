package edu.ucaldas.hackathon.DTOs.camara;

import java.math.BigDecimal;

public record UpdateCamaraDTO(
    String name,
    BigDecimal angleXY,
    BigDecimal angleXZ,
    UpdateLocationDTO location
) {
    
}
