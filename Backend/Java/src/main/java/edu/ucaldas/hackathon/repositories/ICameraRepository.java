package edu.ucaldas.hackathon.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.ucaldas.hackathon.models.Camera;

@Repository
public interface ICameraRepository extends JpaRepository<Camera, UUID> {

}
