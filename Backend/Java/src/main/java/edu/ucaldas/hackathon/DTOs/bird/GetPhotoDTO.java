package edu.ucaldas.hackathon.DTOs.bird;

import java.time.LocalDateTime;
import java.util.UUID;

public record GetPhotoDTO(
    UUID id,
    String url,
    LocalDateTime takenAt
) {
    
}
