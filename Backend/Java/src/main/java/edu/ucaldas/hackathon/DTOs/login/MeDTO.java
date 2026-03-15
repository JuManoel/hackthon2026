package edu.ucaldas.hackathon.DTOs.login;

import java.util.UUID;

public record MeDTO(
    UUID id,
    String username,
    String role
) {
    
}
