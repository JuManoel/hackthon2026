package edu.ucaldas.hackathon.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.bird.GetBirdDTO;
import edu.ucaldas.hackathon.DTOs.bird.GetPhotoDTO;
import edu.ucaldas.hackathon.DTOs.bird.GetSpeciesDTO;
import edu.ucaldas.hackathon.models.Bird;
import edu.ucaldas.hackathon.repositories.IBirdRepository;

@Service
public class BirdService {

	@Autowired
	private IBirdRepository birdRepository;

	public GetBirdDTO getBirdById(String id) {
		var bird = birdRepository.findById(UUID.fromString(id)).orElseThrow(() -> new RuntimeException("Bird not found"));
		return toGetBirdDTO(bird);
	}

	public List<GetBirdDTO> getAllBirds() {
		return birdRepository.findAll().stream().map(this::toGetBirdDTO).toList();
	}

	public List<GetBirdDTO> getBirdsByCamara(String camaraId) {
		return birdRepository.findByCamara_Id(UUID.fromString(camaraId)).stream().map(this::toGetBirdDTO).toList();
	}

	public List<GetBirdDTO> getBirdsBySpecies(String speciesId) {
		return birdRepository.findBySpecies_Id(UUID.fromString(speciesId)).stream().map(this::toGetBirdDTO).toList();
	}

	public List<GetBirdDTO> getBirdsByCamaraAndDateRange(String camaraId, LocalDateTime startDate, LocalDateTime endDate) {
		validateDateRange(startDate, endDate);
		return birdRepository
				.findByCamara_IdAndPhoto_TakenAtBetween(UUID.fromString(camaraId), startDate, endDate)
				.stream()
				.map(this::toGetBirdDTO)
				.toList();
	}

	public List<GetBirdDTO> getBirdsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
		validateDateRange(startDate, endDate);
		return birdRepository.findByPhoto_TakenAtBetween(startDate, endDate).stream().map(this::toGetBirdDTO).toList();
	}

	private void validateDateRange(LocalDateTime startDate, LocalDateTime endDate) {
		if (startDate == null || endDate == null) {
			throw new RuntimeException("start_date and end_date are required");
		}
		if (startDate.isAfter(endDate)) {
			throw new RuntimeException("start_date must be before or equal to end_date");
		}
	}

	private GetBirdDTO toGetBirdDTO(Bird bird) {
		return new GetBirdDTO(
				bird.getId(),
				bird.getProbabilityYolo(),
				new GetSpeciesDTO(
						bird.getSpecies().getId(),
						bird.getSpecies().getPopularName(),
						bird.getSpecies().getScientificName(),
						bird.getSpecies().getYoloLabel()),
				new GetPhotoDTO(
						bird.getPhoto().getId(),
						bird.getPhoto().getUrl(),
						bird.getPhoto().getTakenAt()),
				bird.getCamara().toGetCamaraDTO());
	}
}
