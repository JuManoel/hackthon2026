package edu.ucaldas.hackathon.DTOs.bird;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreatePhotoBirdDTO(
        @NotNull(message = "Probability is required") @DecimalMin(value = "0.00", message = "Probability must be at least 0.00") @DecimalMax(value = "100.00", message = "Probability must be at most 100.00") BigDecimal probabilityYolo,

        @NotBlank(message = "YOLO Species Label is required") String yoloLabel,

        @NotBlank(message = "Camera ID is required and cannot be blank") String cameraId,

        @NotBlank(message = "base64 is required and cannot be blank") String base64,

        @NotNull(message = "TakenAt date is required") LocalDateTime takenAt) {
}
