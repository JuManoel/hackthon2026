package edu.ucaldas.hackathon.DTOs.photo;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdatePhotoDTO(
    @NotBlank(message = "URL is required and cannot be blank")
    String url,

    @NotNull(message = "TakenAt date is required")
    LocalDateTime takenAt
) {

}
