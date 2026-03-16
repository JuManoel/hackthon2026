package edu.ucaldas.hackathon.DTOs.login;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Información del usuario autenticado")
public record MeDTO(
    @Schema(description = "ID único del usuario")
    UUID id,
    @Schema(description = "Nombre de usuario", example = "admin")
    String username,
    @Schema(description = "Rol del usuario", example = "ADMIN", allowableValues = { "ADMIN", "GUIDE" })
    String role
) {

}
