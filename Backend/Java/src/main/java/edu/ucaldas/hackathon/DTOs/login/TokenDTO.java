package edu.ucaldas.hackathon.DTOs.login;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "JWT token de autenticación")
public record TokenDTO(
    @Schema(
        description = "Token JWT válido por 24 horas",
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    )
    String token
) {

}
