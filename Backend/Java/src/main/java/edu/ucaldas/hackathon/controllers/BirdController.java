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

	@GetMapping("/camera/{cameraId}")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByCamera(@PathVariable String cameraId) {
		return ResponseEntity.ok(birdService.getBirdsByCamera(cameraId));
	}

	@GetMapping("/species/{speciesId}")
	public ResponseEntity<List<GetBirdDTO>> getBirdsBySpecies(@PathVariable String speciesId) {
		return ResponseEntity.ok(birdService.getBirdsBySpecies(speciesId));
	}

	@GetMapping("/camera/{cameraId}/range")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByCameraAndDateRange(
			@PathVariable String cameraId,
			@RequestParam(value = "start_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
			@RequestParam("end_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
		return ResponseEntity.ok(birdService.getBirdsByCameraAndDateRange(cameraId, startDate, endDate));
	}

	@GetMapping("/range")
	public ResponseEntity<List<GetBirdDTO>> getBirdsByDateRange(
			@RequestParam(value = "start_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
			@RequestParam(value = "end_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
		return ResponseEntity.ok(birdService.getBirdsByDateRange(startDate, endDate));
	}
}
