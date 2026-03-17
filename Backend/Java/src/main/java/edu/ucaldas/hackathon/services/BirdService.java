package edu.ucaldas.hackathon.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.bird.CreateBirdDTO;
import edu.ucaldas.hackathon.DTOs.bird.CreatePhotoBirdDTO;
import edu.ucaldas.hackathon.DTOs.bird.GetBirdDTO;
import edu.ucaldas.hackathon.DTOs.photo.GetPhotoDTO;
import edu.ucaldas.hackathon.DTOs.species.GetSpeciesDTO;
import edu.ucaldas.hackathon.DTOs.bird.UpdateBirdDTO;
import edu.ucaldas.hackathon.infra.exception.DataNotFound;
import edu.ucaldas.hackathon.infra.exception.MissingData;
import edu.ucaldas.hackathon.models.Bird;
import edu.ucaldas.hackathon.models.Photo;
import edu.ucaldas.hackathon.models.Species;
import edu.ucaldas.hackathon.repositories.IBirdRepository;
import edu.ucaldas.hackathon.repositories.ICameraRepository;
import edu.ucaldas.hackathon.repositories.IPhotoRepository;
import edu.ucaldas.hackathon.repositories.ISpeciesRepository;

@Service
public class BirdService {

	@Autowired
	private IBirdRepository birdRepository;

	@Autowired
	private ISpeciesRepository speciesRepository;

	@Autowired
	private IPhotoRepository photoRepository;

	@Autowired
	private ICameraRepository cameraRepository;

	@Autowired
	private SimpMessagingTemplate messagingTemplate;

	@Value("${bird.realtime.persist:false}")
	private boolean persistRealtimeDetections;

	public GetBirdDTO getBirdById(String id) {
		var bird = birdRepository.findById(UUID.fromString(id)).orElseThrow(() -> new DataNotFound("Bird not found"));
		return toGetBirdDTO(bird);
	}

	public Page<GetBirdDTO> getAllBirds(Pageable pageable) {
		return birdRepository.findAll(pageable).map(this::toGetBirdDTO);
	}

	public List<GetBirdDTO> getBirdsByCamera(String cameraId) {
		return birdRepository.findByCamera_Id(UUID.fromString(cameraId)).stream().map(this::toGetBirdDTO).toList();
	}

	public List<GetBirdDTO> getBirdsBySpecies(String speciesId) {
		return birdRepository.findBySpecies_Id(UUID.fromString(speciesId)).stream().map(this::toGetBirdDTO).toList();
	}

	public List<GetBirdDTO> getBirdsByCameraAndDateRange(String cameraId, LocalDateTime startDate,
			LocalDateTime endDate) {
		validateDateRange(startDate, endDate);
		return birdRepository
				.findByCamera_IdAndDetectedAtBetween(UUID.fromString(cameraId), startDate, endDate)
				.stream()
				.map(this::toGetBirdDTO)
				.toList();
	}

	public List<GetBirdDTO> getBirdsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
		validateDateRange(startDate, endDate);
		return birdRepository.findByDetectedAtBetween(startDate, endDate).stream().map(this::toGetBirdDTO).toList();
	}

	public GetBirdDTO createPhotoAndBird(CreatePhotoBirdDTO createPhotoBirdDTO) {
		var species = resolveSpecies(createPhotoBirdDTO.yoloLabel());
		var camera = cameraRepository.findById(UUID.fromString(createPhotoBirdDTO.cameraId()))
				.orElseThrow(() -> new DataNotFound("Camera not found"));

		if (!persistRealtimeDetections) {
			var birdDTO = new GetBirdDTO(
					UUID.randomUUID(),
					createPhotoBirdDTO.probabilityYolo(),
					new GetSpeciesDTO(
							species.getId(),
							species.getPopularName(),
							species.getScientificName(),
							species.getYoloLabel()),
					new GetPhotoDTO(
							null,
							null,
							createPhotoBirdDTO.takenAt()),
					camera.toGetCameraDTO());
			messagingTemplate.convertAndSend("/topic/alerts", birdDTO);
			return birdDTO;
		}

		var bird = new Bird();
		bird.setProbabilityYolo(createPhotoBirdDTO.probabilityYolo());
		bird.setSpecies(species);
		bird.setPhoto(null);
		bird.setDetectedAt(createPhotoBirdDTO.takenAt());
		bird.setCamera(camera);

		birdRepository.save(bird);

		GetBirdDTO birdDTO = toGetBirdDTO(bird);
		messagingTemplate.convertAndSend("/topic/alerts", birdDTO);

		return birdDTO;
	}

	private Species resolveSpecies(String rawLabel) {
		var normalizedLabel = rawLabel == null ? "" : rawLabel.trim();
		var normalizedScientificName = normalizedLabel.replace("_", " ");

		var speciesByScientificName = speciesRepository.findByScientificName(normalizedScientificName);
		if (speciesByScientificName.isPresent()) {
			return speciesByScientificName.get();
		}

		var speciesByYoloLabel = speciesRepository.findByYoloLabel(normalizedLabel);
		if (speciesByYoloLabel.isPresent()) {
			return speciesByYoloLabel.get();
		}

		var generatedSpecies = new Species();
		generatedSpecies.setPopularName(normalizedScientificName);
		generatedSpecies.setScientificName(normalizedScientificName);
		generatedSpecies.setYoloLabel(normalizedLabel);

		return speciesRepository.save(generatedSpecies);
	}

	public GetBirdDTO createBird(CreateBirdDTO createBirdDTO) {
		var species = speciesRepository.findById(UUID.fromString(createBirdDTO.speciesId()))
				.orElseThrow(() -> new DataNotFound("Species not found"));
		var photo = photoRepository.findById(UUID.fromString(createBirdDTO.photoId()))
				.orElseThrow(() -> new DataNotFound("Photo not found"));
		var camera = cameraRepository.findById(UUID.fromString(createBirdDTO.cameraId()))
				.orElseThrow(() -> new DataNotFound("Camera not found"));

		var bird = new Bird();
		bird.setProbabilityYolo(createBirdDTO.probabilityYolo());
		bird.setSpecies(species);
		bird.setPhoto(photo);
		bird.setDetectedAt(photo.getTakenAt());
		bird.setCamera(camera);

		birdRepository.save(bird);

		GetBirdDTO birdDTO = toGetBirdDTO(bird);
		// Hacemos el broadcast de la detección a todos los clientes que escuchen este
		// tópico
		messagingTemplate.convertAndSend("/topic/alerts", birdDTO);

		return birdDTO;
	}

	public GetBirdDTO updateBird(String id, UpdateBirdDTO updateBirdDTO) {
		var bird = birdRepository.findById(UUID.fromString(id))
				.orElseThrow(() -> new DataNotFound("Bird not found"));
		var species = speciesRepository.findById(UUID.fromString(updateBirdDTO.speciesId()))
				.orElseThrow(() -> new DataNotFound("Species not found"));
		var photo = photoRepository.findById(UUID.fromString(updateBirdDTO.photoId()))
				.orElseThrow(() -> new DataNotFound("Photo not found"));
		var camera = cameraRepository.findById(UUID.fromString(updateBirdDTO.cameraId()))
				.orElseThrow(() -> new DataNotFound("Camera not found"));

		bird.setProbabilityYolo(updateBirdDTO.probabilityYolo());
		bird.setSpecies(species);
		bird.setPhoto(photo);
		bird.setDetectedAt(photo.getTakenAt());
		bird.setCamera(camera);

		birdRepository.save(bird);
		return toGetBirdDTO(bird);
	}

	public void deleteBird(String id) {
		var bird = birdRepository.findById(UUID.fromString(id))
				.orElseThrow(() -> new DataNotFound("Bird not found"));
		birdRepository.delete(bird);
	}

	private void validateDateRange(LocalDateTime startDate, LocalDateTime endDate) {
		if (startDate == null || endDate == null) {
			throw new MissingData("start_date and end_date are required");
		}
		if (startDate.isAfter(endDate)) {
			throw new IllegalArgumentException("start_date must be before or equal to end_date");
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
						bird.getPhoto() != null ? bird.getPhoto().getId() : null,
						bird.getPhoto() != null ? bird.getPhoto().getBase64() : null,
						bird.getPhoto() != null ? bird.getPhoto().getTakenAt() : bird.getDetectedAt()),
				bird.getCamera().toGetCameraDTO());
	}
}
