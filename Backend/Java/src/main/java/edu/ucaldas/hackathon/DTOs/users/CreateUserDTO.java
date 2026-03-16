package edu.ucaldas.hackathon.DTOs.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos para crear un nuevo usuario")
public record CreateUserDTO(
    @NotBlank(message = "Username is required and cannot be blank")
    @Schema(description = "Nombre de usuario único", example = "admin")
    String username,

    @NotBlank(message = "Password is required and cannot be blank")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Schema(description = "Contraseña del usuario (mínimo 8 caracteres)", example = "SecurePass123")
    String password,

    @NotBlank(message = "Role is required and cannot be blank")
    @Pattern(regexp = "^(ADMIN|GUIDE)$", message = "Role must be ADMIN or GUIDE")
    @Schema(description = "Rol del usuario", example = "ADMIN", allowableValues = { "ADMIN", "GUIDE" })
    String role
) {

}
