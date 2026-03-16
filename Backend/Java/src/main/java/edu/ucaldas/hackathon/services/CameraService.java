package edu.ucaldas.hackathon.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.camera.CreateCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.GetCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.MonitoringCamerasDTO;
import edu.ucaldas.hackathon.DTOs.camera.UpdateCameraDTO;
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

    public List<GetCameraDTO> getAllCameras() {
        var cameras = cameraRepository.findAll();
        return cameras.stream().map(Camera::toGetCameraDTO).toList();
    }

    public GetCameraDTO getCameraById(String id) {
        var camera = cameraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new RuntimeException("Camera not found"));
        return camera.toGetCameraDTO();
    }

    @Transactional
    public GetCameraDTO updateCamera(String id, UpdateCameraDTO updateCameraDTO) {
        var camera = cameraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new RuntimeException("Camera not found"));
        camera.update(updateCameraDTO);
        cameraRepository.save(camera);
        return camera.toGetCameraDTO();
    }

    @Transactional
    public void deleteCamera(String id) {
        var camera = cameraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new RuntimeException("Camera not found"));
        cameraRepository.delete(camera);
    }

    public MonitoringCamerasDTO getMonitoringCameras(int windowSeconds) {
        if (windowSeconds <= 0) {
            throw new RuntimeException("window_seconds must be greater than 0");
        }

        var generatedAt = LocalDateTime.now();
        var windowStart = generatedAt.minusSeconds(windowSeconds);
        var activeCameraIds = birdRepository.findDistinctCameraIdsDetectedSince(windowStart);

        return new MonitoringCamerasDTO(generatedAt, windowStart, activeCameraIds);
    }
}
