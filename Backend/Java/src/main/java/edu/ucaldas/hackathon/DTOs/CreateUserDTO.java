package edu.ucaldas.hackathon.DTOs;

public record CreateUserDTO(
    String username,
    String password,
    String role
) {

}
