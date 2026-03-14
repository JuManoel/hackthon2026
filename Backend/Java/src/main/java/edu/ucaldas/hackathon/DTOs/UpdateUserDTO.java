package edu.ucaldas.hackathon.DTOs;

public record UpdateUserDTO(
    String username,
    String password,
    String role
) {
    
}
