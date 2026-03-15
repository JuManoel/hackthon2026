package edu.ucaldas.hackathon.DTOs.users;

public record CreateUserDTO(
    String username,
    String password,
    String role
) {

}
