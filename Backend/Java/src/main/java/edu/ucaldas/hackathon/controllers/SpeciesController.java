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

import edu.ucaldas.hackathon.DTOs.species.CreateSpeciesDTO;
import edu.ucaldas.hackathon.DTOs.species.GetSpeciesDTO;
import edu.ucaldas.hackathon.DTOs.species.UpdateSpeciesDTO;
import edu.ucaldas.hackathon.services.SpeciesService;
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
@RequestMapping("/species")
@Tag(name = "Especies", description = "Endpoints para gestión de especies de pájaros")
public class SpeciesController {

    @Autowired
    private SpeciesService speciesService;

    @GetMapping("/{id}")
    @Operation(
        summary = "Obtener especie por ID",
        description = "Retorna la información de una especie de pájaro específica"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Especie encontrada",
            content = @Content(schema = @Schema(implementation = GetSpeciesDTO.class))
        ),
        @ApiResponse(responseCode = "404", description = "Especie no encontrada")
    })
    public ResponseEntity<GetSpeciesDTO> getSpecies(
            @Parameter(description = "ID de la especie")
            @PathVariable String id) {
        var species = speciesService.getSpeciesById(id);
        return ResponseEntity.ok(species);
    }

    @GetMapping("")
    @Operation(
        summary = "Obtener todas las especies (paginado)",
        description = "Retorna una lista paginada de todas las especies de pájaros registradas"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de especies"),
        @ApiResponse(responseCode = "400", description = "Parámetros de paginación inválidos"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<Page<GetSpeciesDTO>> getAllSpecies(
            @Parameter(description = "Configuración de paginación (page, size, sort)")
            @PageableDefault(size = 20) Pageable pageable) {
        var species = speciesService.getAllSpecies(pageable);
        return ResponseEntity.ok(species);
    }

    @PostMapping("")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Crear nueva especie",
        description = "Crea un nuevo registro de especie de pájaro"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Especie creada exitosamente",
            content = @Content(schema = @Schema(implementation = GetSpeciesDTO.class))
        ),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<GetSpeciesDTO> createSpecies(@Valid @RequestBody CreateSpeciesDTO createSpeciesDTO) {
        var species = speciesService.createSpecies(createSpeciesDTO);
        return ResponseEntity.created(URI.create("/species/" + species.id())).body(species);
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Actualizar especie",
        description = "Actualiza los datos de una especie existente"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Especie actualizada",
            content = @Content(schema = @Schema(implementation = GetSpeciesDTO.class))
        ),
        @ApiResponse(responseCode = "404", description = "Especie no encontrada"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<GetSpeciesDTO> updateSpecies(
            @Parameter(description = "ID de la especie")
            @PathVariable String id,
            @Valid @RequestBody UpdateSpeciesDTO updateSpeciesDTO) {
        var species = speciesService.updateSpecies(id, updateSpeciesDTO);
        return ResponseEntity.ok(species);
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Eliminar especie",
        description = "Elimina un registro de especie del sistema"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Especie eliminada"),
        @ApiResponse(responseCode = "404", description = "Especie no encontrada"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<String> deleteSpecies(
            @Parameter(description = "ID de la especie")
            @PathVariable String id) {
        speciesService.deleteSpecies(id);
        return ResponseEntity.noContent().build();
    }
}
