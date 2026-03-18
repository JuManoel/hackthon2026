package edu.ucaldas.hackathon.controllers;

import java.net.URI;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ucaldas.hackathon.DTOs.photo.CreatePhotoDTO;
import edu.ucaldas.hackathon.DTOs.photo.GetPhotoDTO;
import edu.ucaldas.hackathon.DTOs.photo.UpdatePhotoDTO;
import edu.ucaldas.hackathon.services.PhotoService;
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
@RequestMapping("/photo")
@Tag(name = "Fotos", description = "Endpoints para gestión de fotografías de pájaros detectados")
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    @GetMapping("/{id}")
    @Operation(
        summary = "Obtener fotografía por ID",
        description = "Retorna los detalles de una fotografía específica de un pájaro detectado"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Fotografía encontrada",
            content = @Content(schema = @Schema(implementation = GetPhotoDTO.class))
        ),
        @ApiResponse(responseCode = "404", description = "Fotografía no encontrada")
    })
    public ResponseEntity<GetPhotoDTO> getPhoto(
            @Parameter(description = "ID de la fotografía")
            @PathVariable String id) {
        var photo = photoService.getPhotoById(id);
        return ResponseEntity.ok(photo);
    }

    @GetMapping("")
    @Operation(
        summary = "Obtener todas las fotografías (paginado)",
        description = "Retorna una lista paginada de todas las fotografías registradas en el sistema"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de fotografías"),
        @ApiResponse(responseCode = "400", description = "Parámetros de paginación inválidos"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<Page<GetPhotoDTO>> getAllPhotos(
            @Parameter(description = "Configuración de paginación (page, size, sort)")
            @PageableDefault(size = 20) Pageable pageable) {
        var photos = photoService.getAllPhotos(pageable);
        return ResponseEntity.ok(photos);
    }

    @PostMapping("")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Crear nueva fotografía",
        description = "Crea un nuevo registro de fotografía de un pájaro detectado"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Fotografía creada exitosamente",
            content = @Content(schema = @Schema(implementation = GetPhotoDTO.class))
        ),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<GetPhotoDTO> createPhoto(@Valid @RequestBody CreatePhotoDTO createPhotoDTO) {
        var photo = photoService.createPhoto(createPhotoDTO);
        return ResponseEntity.created(URI.create("/photo/" + photo.id())).body(photo);
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Actualizar fotografía",
        description = "Actualiza los datos de una fotografía existente"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Fotografía actualizada",
            content = @Content(schema = @Schema(implementation = GetPhotoDTO.class))
        ),
        @ApiResponse(responseCode = "404", description = "Fotografía no encontrada"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<GetPhotoDTO> updatePhoto(
            @Parameter(description = "ID de la fotografía")
            @PathVariable String id,
            @Valid @RequestBody UpdatePhotoDTO updatePhotoDTO) {
        var photo = photoService.updatePhoto(id, updatePhotoDTO);
        return ResponseEntity.ok(photo);
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Eliminar fotografía",
        description = "Elimina un registro de fotografía del sistema"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Fotografía eliminada"),
        @ApiResponse(responseCode = "404", description = "Fotografía no encontrada"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<String> deletePhoto(
            @Parameter(description = "ID de la fotografía")
            @PathVariable String id) {
        photoService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }
}
