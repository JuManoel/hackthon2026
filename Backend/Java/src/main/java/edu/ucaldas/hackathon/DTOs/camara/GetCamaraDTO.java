package edu.ucaldas.hackathon.DTOs.camara;

import java.math.BigDecimal;

public record GetCamaraDTO(
    String id,
    String name,
    BigDecimal angleXY,
    BigDecimal angleXZ,
    GetLocationDTO location
) {
    
}
