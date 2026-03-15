package edu.ucaldas.hackathon.DTOs.users;

import java.util.UUID;

public record GetUserDTO(
    UUID id,
    String username,
    String role
) {
    
}
