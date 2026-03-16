package edu.ucaldas.hackathon.controllers;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ucaldas.hackathon.DTOs.bird.CreateBirdDTO;
import edu.ucaldas.hackathon.DTOs.bird.GetBirdDTO;
import edu.ucaldas.hackathon.DTOs.bird.UpdateBirdDTO;
import edu.ucaldas.hackathon.services.BirdService;
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
@RequestMapping("/bird")
@Tag(name = "Pájaros", description = "Endpoints para gestión de registros de pájaros detectados")
public class BirdController {

	@Autowired
	private BirdService birdService;

	@GetMapping("/{id}")
	@Operation(
		summary = "Obtener pájaro por ID",
		description = "Retorna los detalles de un pájaro específico identificado por su ID"
	)
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "Pájaro encontrado",
			content = @Content(schema = @Schema(implementation = GetBirdDTO.class))
		),
		@ApiResponse(
			responseCode = "404",
			description = "Pájaro no encontrado"
		)
	})
	public ResponseEntity<GetBirdDTO> getBirdById(
			@Parameter(description = "ID del pájaro")
			@PathVariable String id) {
		return ResponseEntity.ok(birdService.getBirdById(id));
	}

	@GetMapping("")
	@Operation(
		summary = "Obtener todos los pájaros (paginado)",
		description = "Retorna una lista paginada de todos los pájaros registrados en el sistema"
	)
	@ApiResponse(
		responseCode = "200",
		description = "Lista de pájaros"
	)
	public ResponseEntity<Page<GetBirdDTO>> getAllBirds(
			@Parameter(description = "Configuración de paginación (page, size, sort)")
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(birdService.getAllBirds(pageable));
	}

	@GetMapping("/camera/{cameraId}")
	@Operation(
		summary = "Obtener pájaros por cámara",
		description = "Retorna todos los pájaros detectados por una cámara específica"
	)
	@ApiResponse(responseCode = "200", description = "Lista de pájaros")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByCamera(
			@Parameter(description = "ID de la cámara")
			@PathVariable String cameraId) {
		return ResponseEntity.ok(birdService.getBirdsByCamera(cameraId));
	}

	@GetMapping("/species/{speciesId}")
	@Operation(
		summary = "Obtener pájaros por especie",
		description = "Retorna todos los pájaros de una especie específica"
	)
	@ApiResponse(responseCode = "200", description = "Lista de pájaros")
	public ResponseEntity<List<GetBirdDTO>> getBirdsBySpecies(
			@Parameter(description = "ID de la especie")
			@PathVariable String speciesId) {
		return ResponseEntity.ok(birdService.getBirdsBySpecies(speciesId));
	}

	@GetMapping("/camera/{cameraId}/range")
	@Operation(
		summary = "Obtener pájaros por cámara en rango de fechas",
		description = "Retorna los pájaros detectados por una cámara dentro de un rango de fechas"
	)
	@ApiResponse(responseCode = "200", description = "Lista de pájaros")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByCameraAndDateRange(
			@Parameter(description = "ID de la cámara")
			@PathVariable String cameraId,
			@Parameter(description = "Fecha y hora de inicio (ISO 8601)")
			@RequestParam(value = "start_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
			@Parameter(description = "Fecha y hora de fin (ISO 8601)")
			@RequestParam("end_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
		return ResponseEntity.ok(birdService.getBirdsByCameraAndDateRange(cameraId, startDate, endDate));
	}

	@GetMapping("/range")
	@Operation(
		summary = "Obtener pájaros en rango de fechas",
		description = "Retorna todos los pájaros detectados dentro de un rango de fechas"
	)
	@ApiResponse(responseCode = "200", description = "Lista de pájaros")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByDateRange(
			@Parameter(description = "Fecha y hora de inicio (ISO 8601)")
			@RequestParam(value = "start_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
			@Parameter(description = "Fecha y hora de fin (ISO 8601)")
			@RequestParam(value = "end_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
		return ResponseEntity.ok(birdService.getBirdsByDateRange(startDate, endDate));
	}

	@PostMapping("")
	@SecurityRequirement(name = "bearer-jwt")
	@Operation(
		summary = "Crear nuevo registro de pájaro",
		description = "Crea un nuevo registro de un pájaro detectado por una cámara"
	)
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "201",
			description = "Pájaro creado exitosamente",
			content = @Content(schema = @Schema(implementation = GetBirdDTO.class))
		),
		@ApiResponse(
			responseCode = "400",
			description = "Datos inválidos"
		),
		@ApiResponse(
			responseCode = "401",
			description = "No autenticado"
		)
	})
	public ResponseEntity<GetBirdDTO> createBird(@Valid @RequestBody CreateBirdDTO createBirdDTO) {
		var bird = birdService.createBird(createBirdDTO);
		return ResponseEntity.created(URI.create("/bird/" + bird.id())).body(bird);
	}

	@PutMapping("/{id}")
	@SecurityRequirement(name = "bearer-jwt")
	@Operation(
		summary = "Actualizar registro de pájaro",
		description = "Actualiza los datos de un registro de pájaro existente"
	)
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "Pájaro actualizado",
			content = @Content(schema = @Schema(implementation = GetBirdDTO.class))
		),
		@ApiResponse(responseCode = "404", description = "Pájaro no encontrado"),
		@ApiResponse(responseCode = "401", description = "No autenticado")
	})
	public ResponseEntity<GetBirdDTO> updateBird(
			@Parameter(description = "ID del pájaro")
			@PathVariable String id,
			@Valid @RequestBody UpdateBirdDTO updateBirdDTO) {
		var bird = birdService.updateBird(id, updateBirdDTO);
		return ResponseEntity.ok(bird);
	}

	@DeleteMapping("/{id}")
	@SecurityRequirement(name = "bearer-jwt")
	@Operation(
		summary = "Eliminar registro de pájaro",
		description = "Elimina un registro de pájaro del sistema"
	)
	@ApiResponses(value = {
		@ApiResponse(responseCode = "204", description = "Pájaro eliminado"),
		@ApiResponse(responseCode = "404", description = "Pájaro no encontrado"),
		@ApiResponse(responseCode = "401", description = "No autenticado")
	})
	public ResponseEntity<String> deleteBird(
			@Parameter(description = "ID del pájaro")
			@PathVariable String id) {
		birdService.deleteBird(id);
		return ResponseEntity.noContent().build();
	}
}
