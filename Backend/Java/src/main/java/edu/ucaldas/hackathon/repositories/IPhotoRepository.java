package edu.ucaldas.hackathon.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.ucaldas.hackathon.models.Photo;

@Repository
public interface IPhotoRepository extends JpaRepository<Photo, UUID> {

}
