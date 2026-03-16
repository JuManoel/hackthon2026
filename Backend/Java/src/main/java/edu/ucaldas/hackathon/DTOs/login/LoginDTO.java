package edu.ucaldas.hackathon.DTOs.login;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Credenciales para autenticación de usuario")
public record LoginDTO(
    @Schema(description = "Nombre de usuario", example = "admin")
    String username,
    @Schema(description = "Contraseña del usuario", example = "password123")
    String password
) {

}
