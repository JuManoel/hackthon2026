package edu.ucaldas.hackathon.DTOs.users;

public record UpdateUserDTO(
    String username,
    String password,
    String role
) {
    
}
