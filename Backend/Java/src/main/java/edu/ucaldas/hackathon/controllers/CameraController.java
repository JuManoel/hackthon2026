package edu.ucaldas.hackathon.controllers;

import java.net.URI;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ucaldas.hackathon.DTOs.camera.CreateCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.GetCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.MonitoringSocketStatusDTO;
import edu.ucaldas.hackathon.DTOs.camera.UpdateCameraDTO;
import edu.ucaldas.hackathon.services.CameraMonitoringSubscriptionTracker;
import edu.ucaldas.hackathon.services.CameraService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/camera")
@Tag(name = "Cámaras", description = "Endpoints para gestión de cámaras de monitoreo de pájaros")
public class CameraController {
    @Autowired
    private CameraService cameraService;

    @Autowired
    private CameraMonitoringSubscriptionTracker subscriptionTracker;

    @GetMapping("/{id}")
    @Operation(
        summary = "Obtener cámara por ID",
        description = "Retorna los detalles de una cámara de monitoreo específica"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Cámara encontrada",
            content = @Content(schema = @Schema(implementation = GetCameraDTO.class))
        ),
        @ApiResponse(responseCode = "404", description = "Cámara no encontrada")
    })
    public ResponseEntity<GetCameraDTO> getCamera(
            @Parameter(description = "ID de la cámara")
            @PathVariable String id) {
        var camera = cameraService.getCameraById(id);
        return ResponseEntity.ok(camera);
    }

    @GetMapping("")
    @Operation(
        summary = "Obtener todas las cámaras (paginado)",
        description = "Retorna una lista paginada de todas las cámaras registradas en el sistema"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de cámaras"),
        @ApiResponse(responseCode = "400", description = "Parámetros de paginación inválidos"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<Page<GetCameraDTO>> getAllCameras(
            @Parameter(description = "Configuración de paginación (page, size, sort)")
            @PageableDefault(size = 20) Pageable pageable) {
        var cameras = cameraService.getAllCameras(pageable);
        return ResponseEntity.ok(cameras);
    }

    @GetMapping("/monitoring/status")
    @Operation(
        summary = "Obtener estado del monitoreo en tiempo real",
        description = "Retorna el estado actual de las suscripciones de monitoreo WebSocket"
    )
    @ApiResponse(
        responseCode = "200",
        description = "Estado del monitoreo",
        content = @Content(schema = @Schema(implementation = MonitoringSocketStatusDTO.class))
    )
    public ResponseEntity<MonitoringSocketStatusDTO> getMonitoringSocketStatus() {
        var response = new MonitoringSocketStatusDTO(
                subscriptionTracker.hasActiveSubscribers(),
                subscriptionTracker.getActiveSubscriptionsCount());
        return ResponseEntity.ok(response);
    }

    @PostMapping("")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Crear nueva cámara",
        description = "Crea un nuevo registro de cámara de monitoreo"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Cámara creada exitosamente",
            content = @Content(schema = @Schema(implementation = GetCameraDTO.class))
        ),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<GetCameraDTO> createCamera(@Valid @RequestBody CreateCameraDTO createCameraDTO) {
        var camera = cameraService.createCamera(createCameraDTO);
        return ResponseEntity.created(URI.create("/camera/" + camera.id())).body(camera);
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Actualizar cámara",
        description = "Actualiza los datos de una cámara existente"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Cámara actualizada",
            content = @Content(schema = @Schema(implementation = GetCameraDTO.class))
        ),
        @ApiResponse(responseCode = "404", description = "Cámara no encontrada"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<GetCameraDTO> updateCamera(
            @Parameter(description = "ID de la cámara")
            @PathVariable String id,
            @Valid @RequestBody UpdateCameraDTO updateCameraDTO) {
        var camera = cameraService.updateCamera(id, updateCameraDTO);
        return ResponseEntity.ok(camera);
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Eliminar cámara",
        description = "Elimina un registro de cámara del sistema"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Cámara eliminada"),
        @ApiResponse(responseCode = "404", description = "Cámara no encontrada"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<String> deleteCamera(
            @Parameter(description = "ID de la cámara")
            @PathVariable String id) {
        cameraService.deleteCamera(id);
        return ResponseEntity.noContent().build();
    }

}
