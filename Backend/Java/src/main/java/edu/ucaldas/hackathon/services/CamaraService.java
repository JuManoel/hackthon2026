package edu.ucaldas.hackathon.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.camara.CreateCamaraDTO;
import edu.ucaldas.hackathon.DTOs.camara.GetCamaraDTO;
import edu.ucaldas.hackathon.DTOs.camara.MonitoringCamarasDTO;
import edu.ucaldas.hackathon.DTOs.camara.UpdateCamaraDTO;
import edu.ucaldas.hackathon.models.Camara;
import edu.ucaldas.hackathon.repositories.IBirdRepository;
import edu.ucaldas.hackathon.repositories.ICamaraRepository;
import jakarta.transaction.Transactional;

@Service
public class CamaraService {
    @Autowired
    private ICamaraRepository camaraRepository;

    @Autowired
    private IBirdRepository birdRepository;

    public GetCamaraDTO createCamara(CreateCamaraDTO createCamaraDTO) {
        var camara = new Camara(createCamaraDTO);
        camaraRepository.save(camara);
        return camara.toGetCamaraDTO();
    }

    public List<GetCamaraDTO> getAllCamaras() {
        var camaras = camaraRepository.findAll();
        return camaras.stream().map(Camara::toGetCamaraDTO).toList();
    }

    public GetCamaraDTO getCamaraById(String id) {
        var camara = camaraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new RuntimeException("Camara not found"));
        return camara.toGetCamaraDTO();
    }

    @Transactional
    public GetCamaraDTO updateCamara(String id, UpdateCamaraDTO updateCamaraDTO) {
        var camara = camaraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new RuntimeException("Camara not found"));
        camara.update(updateCamaraDTO);
        camaraRepository.save(camara);
        return camara.toGetCamaraDTO();
    }

    @Transactional
    public void deleteCamara(String id) {
        var camara = camaraRepository.findById(UUID.fromString(id)).orElseThrow(() -> new RuntimeException("Camara not found"));
        camaraRepository.delete(camara);
    }

    public MonitoringCamarasDTO getMonitoringCamaras(int windowSeconds) {
        if (windowSeconds <= 0) {
            throw new RuntimeException("window_seconds must be greater than 0");
        }

        var generatedAt = LocalDateTime.now();
        var windowStart = generatedAt.minusSeconds(windowSeconds);
        var activeCamaraIds = birdRepository.findDistinctCamaraIdsDetectedSince(windowStart);

        return new MonitoringCamarasDTO(generatedAt, windowStart, activeCamaraIds);
    }
}
