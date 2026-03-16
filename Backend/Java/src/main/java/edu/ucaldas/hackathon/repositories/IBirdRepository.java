package edu.ucaldas.hackathon.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.ucaldas.hackathon.models.Bird;

@Repository
public interface IBirdRepository extends JpaRepository<Bird, UUID>{

	List<Bird> findByCamera_Id(UUID cameraId);

	List<Bird> findBySpecies_Id(UUID speciesId);

	List<Bird> findByCamera_IdAndPhoto_TakenAtBetween(UUID cameraId, LocalDateTime startDate, LocalDateTime endDate);

	List<Bird> findByPhoto_TakenAtBetween(LocalDateTime startDate, LocalDateTime endDate);

	@Query("SELECT DISTINCT b.camera.id FROM Bird b WHERE b.photo.takenAt >= :since")
	List<UUID> findDistinctCameraIdsDetectedSince(@Param("since") LocalDateTime since);
}
