package edu.ucaldas.hackathon.services;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.camera.CreateCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.GetCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.MonitoringCamerasDTO;
import edu.ucaldas.hackathon.DTOs.camera.UpdateCameraDTO;
import edu.ucaldas.hackathon.infra.exception.DataNotFound;
import edu.ucaldas.hackathon.models.Camera;
import edu.ucaldas.hackathon.repositories.IBirdRepository;
import edu.ucaldas.hackathon.repositories.ICameraRepository;
import jakarta.transaction.Transactional;

@Service
public class CameraService {
    @Autowired
    private ICameraRepository cameraRepository;

    @Autowired
    private IBirdRepository birdRepository;

    public GetCameraDTO createCamera(CreateCameraDTO createCameraDTO) {
        var camera = new Camera(createCameraDTO);
        cameraRepository.save(camera);
        return camera.toGetCameraDTO();
    }

    public Page<GetCameraDTO> getAllCameras(Pageable pageable) {
        return cameraRepository.findAll(pageable).map(Camera::toGetCameraDTO);
    }

    public GetCameraDTO getCameraById(String id) {
        var camera = cameraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new DataNotFound("Camera not found"));
        return camera.toGetCameraDTO();
    }

    @Transactional
    public GetCameraDTO updateCamera(String id, UpdateCameraDTO updateCameraDTO) {
        var camera = cameraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new DataNotFound("Camera not found"));
        camera.update(updateCameraDTO);
        cameraRepository.save(camera);
        return camera.toGetCameraDTO();
    }

    @Transactional
    public void deleteCamera(String id) {
        var camera = cameraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new DataNotFound("Camera not found"));
        cameraRepository.delete(camera);
    }

    public MonitoringCamerasDTO getMonitoringCameras(int windowSeconds) {
        if (windowSeconds <= 0) {
            throw new IllegalArgumentException("window_seconds must be greater than 0");
        }

        var generatedAt = LocalDateTime.now();
        var windowStart = generatedAt.minusSeconds(windowSeconds);
        var activeCameraIds = birdRepository.findDistinctCameraIdsDetectedSince(windowStart);

        return new MonitoringCamerasDTO(generatedAt, windowStart, activeCameraIds);
    }
}
