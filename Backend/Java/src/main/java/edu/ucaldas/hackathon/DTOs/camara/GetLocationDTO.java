package edu.ucaldas.hackathon.DTOs.camara;

import java.math.BigDecimal;

public record GetLocationDTO(
    String region,
    String address,
    BigDecimal latitude,
    BigDecimal longitude,
    BigDecimal height
) {
    
}
