package edu.ucaldas.hackathon.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.ucaldas.hackathon.models.Species;

@Repository
public interface ISpeciesRepository extends JpaRepository<Species, UUID> {
    Optional<Species> findByYoloLabel(String yoloLabel);
    Optional<Species> findByScientificName(String scientificName);
}