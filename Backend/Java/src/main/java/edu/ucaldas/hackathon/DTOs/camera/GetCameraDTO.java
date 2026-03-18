package edu.ucaldas.hackathon.DTOs.camera;

import java.math.BigDecimal;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Información de una cámara de monitoreo")
public record GetCameraDTO(
    @Schema(description = "ID único de la cámara")
    UUID id,
    @Schema(description = "Nombre de la cámara", example = "Cámara Noreste")
    String name,
    @Schema(description = "Ángulo XY en grados (0-360)", example = "45.5")
    BigDecimal angleXY,
    @Schema(description = "Ángulo XZ en grados (0-360)", example = "30.0")
    BigDecimal angleXZ,
    @Schema(description = "Ubicación geográfica de la cámara")
    GetLocationDTO location
) {

}
