package edu.ucaldas.hackathon.DTOs.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserDTO(
    @NotBlank(message = "Username is required and cannot be blank")
    String username,

    @NotBlank(message = "Password is required and cannot be blank")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,

    @NotBlank(message = "Role is required and cannot be blank")
    @Pattern(regexp = "^(ADMIN|GUIDE)$", message = "Role must be ADMIN or GUIDE")
    String role
) {

}
