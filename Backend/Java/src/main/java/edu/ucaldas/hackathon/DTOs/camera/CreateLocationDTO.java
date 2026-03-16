package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;

public record CreateLocationDTO(
    String region,
    String address,
    BigDecimal latitude,
    BigDecimal longitude,
    BigDecimal height
) {
    
}
