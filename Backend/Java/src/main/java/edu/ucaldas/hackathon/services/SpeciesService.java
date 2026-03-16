package edu.ucaldas.hackathon.services;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.species.CreateSpeciesDTO;
import edu.ucaldas.hackathon.DTOs.species.GetSpeciesDTO;
import edu.ucaldas.hackathon.DTOs.species.UpdateSpeciesDTO;
import edu.ucaldas.hackathon.infra.exception.DataNotFound;
import edu.ucaldas.hackathon.models.Species;
import edu.ucaldas.hackathon.repositories.ISpeciesRepository;

@Service
public class SpeciesService {

    @Autowired
    private ISpeciesRepository speciesRepository;

    public GetSpeciesDTO getSpeciesById(String id) {
        var species = speciesRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new DataNotFound("Species not found"));
        return toGetSpeciesDTO(species);
    }

    public List<GetSpeciesDTO> getAllSpecies() {
        return speciesRepository.findAll().stream().map(this::toGetSpeciesDTO).toList();
    }

    public GetSpeciesDTO createSpecies(CreateSpeciesDTO createSpeciesDTO) {
        var species = new Species();
        species.setPopularName(createSpeciesDTO.popularName());
        species.setScientificName(createSpeciesDTO.scientificName());
        species.setYoloLabel(createSpeciesDTO.yoloLabel());

        speciesRepository.save(species);
        return toGetSpeciesDTO(species);
    }

    public GetSpeciesDTO updateSpecies(String id, UpdateSpeciesDTO updateSpeciesDTO) {
        var species = speciesRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new DataNotFound("Species not found"));

        species.setPopularName(updateSpeciesDTO.popularName());
        species.setScientificName(updateSpeciesDTO.scientificName());
        species.setYoloLabel(updateSpeciesDTO.yoloLabel());

        speciesRepository.save(species);
        return toGetSpeciesDTO(species);
    }

    public void deleteSpecies(String id) {
        var species = speciesRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new DataNotFound("Species not found"));
        speciesRepository.delete(species);
    }

    private GetSpeciesDTO toGetSpeciesDTO(Species species) {
        return new GetSpeciesDTO(
                species.getId(),
                species.getPopularName(),
                species.getScientificName(),
                species.getYoloLabel());
    }
}
