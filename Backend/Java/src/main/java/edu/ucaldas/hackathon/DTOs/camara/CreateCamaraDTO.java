package edu.ucaldas.hackathon.DTOs.camara;

import java.math.BigDecimal;

public record CreateCamaraDTO(
    String name,
    BigDecimal angleXY,
    BigDecimal angleXZ,
    CreateLocationDTO location

) {
    
}
