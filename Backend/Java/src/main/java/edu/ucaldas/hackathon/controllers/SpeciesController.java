package edu.ucaldas.hackathon.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

@RestController
@RequestMapping("/species")
public class SpeciesController {

    @Autowired
    private SpeciesService speciesService;

    @GetMapping("/{id}")
    public ResponseEntity<GetSpeciesDTO> getSpecies(@PathVariable String id) {
        var species = speciesService.getSpeciesById(id);
        return ResponseEntity.ok(species);
    }

    @GetMapping("")
    public ResponseEntity<List<GetSpeciesDTO>> getAllSpecies() {
        var species = speciesService.getAllSpecies();
        return ResponseEntity.ok(species);
    }

    @PostMapping("")
    public ResponseEntity<GetSpeciesDTO> createSpecies(@Valid @RequestBody CreateSpeciesDTO createSpeciesDTO) {
        var species = speciesService.createSpecies(createSpeciesDTO);
        return ResponseEntity.created(URI.create("/species/" + species.id())).body(species);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GetSpeciesDTO> updateSpecies(@PathVariable String id, @Valid @RequestBody UpdateSpeciesDTO updateSpeciesDTO) {
        var species = speciesService.updateSpecies(id, updateSpeciesDTO);
        return ResponseEntity.ok(species);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSpecies(@PathVariable String id) {
        speciesService.deleteSpecies(id);
        return ResponseEntity.noContent().build();
    }
}
