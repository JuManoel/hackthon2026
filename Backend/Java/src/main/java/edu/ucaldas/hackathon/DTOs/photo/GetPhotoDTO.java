package edu.ucaldas.hackathon.DTOs.photo;

import java.time.LocalDateTime;
import java.util.UUID;

public record GetPhotoDTO(
    UUID id,
    String url,
    LocalDateTime takenAt
) {

}
