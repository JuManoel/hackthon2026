package edu.ucaldas.hackathon.controllers;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ucaldas.hackathon.DTOs.bird.GetBirdDTO;
import edu.ucaldas.hackathon.services.BirdService;

@RestController
@RequestMapping("/bird")
public class BirdController {

	@Autowired
	private BirdService birdService;

	@GetMapping("/{id}")
	public ResponseEntity<GetBirdDTO> getBirdById(@PathVariable String id) {
		return ResponseEntity.ok(birdService.getBirdById(id));
	}

	@GetMapping("")
	public ResponseEntity<List<GetBirdDTO>> getAllBirds() {
		return ResponseEntity.ok(birdService.getAllBirds());
	}

	@GetMapping("/camara/{camaraId}")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByCamara(@PathVariable String camaraId) {
		return ResponseEntity.ok(birdService.getBirdsByCamara(camaraId));
	}

	@GetMapping("/species/{speciesId}")
	public ResponseEntity<List<GetBirdDTO>> getBirdsBySpecies(@PathVariable String speciesId) {
		return ResponseEntity.ok(birdService.getBirdsBySpecies(speciesId));
	}

	@GetMapping("/camara/{camaraId}/range")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByCamaraAndDateRange(
			@PathVariable String camaraId,
			@RequestParam(value = "start_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
			@RequestParam(value = "stard_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime stardDate,
			@RequestParam("end_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
		var effectiveStartDate = startDate != null ? startDate : stardDate;
		return ResponseEntity.ok(birdService.getBirdsByCamaraAndDateRange(camaraId, effectiveStartDate, endDate));
	}

	@GetMapping("/range")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByDateRange(
			@RequestParam(value = "start_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
			@RequestParam(value = "stard_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime stardDate,
			@RequestParam("end_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
		var effectiveStartDate = startDate != null ? startDate : stardDate;
		return ResponseEntity.ok(birdService.getBirdsByDateRange(effectiveStartDate, endDate));
	}
}
