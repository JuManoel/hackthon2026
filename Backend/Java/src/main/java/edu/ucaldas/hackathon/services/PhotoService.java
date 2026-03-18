package edu.ucaldas.hackathon.services;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.photo.CreatePhotoDTO;
import edu.ucaldas.hackathon.DTOs.photo.GetPhotoDTO;
import edu.ucaldas.hackathon.DTOs.photo.UpdatePhotoDTO;
import edu.ucaldas.hackathon.infra.exception.DataNotFound;
import edu.ucaldas.hackathon.models.Photo;
import edu.ucaldas.hackathon.repositories.IPhotoRepository;

@Service
public class PhotoService {

    @Autowired
    private IPhotoRepository photoRepository;

    public GetPhotoDTO getPhotoById(String id) {
        var photo = photoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new DataNotFound("Photo not found"));
        return toGetPhotoDTO(photo);
    }

    public Page<GetPhotoDTO> getAllPhotos(Pageable pageable) {
        return photoRepository.findAll(pageable).map(this::toGetPhotoDTO);
    }

    public GetPhotoDTO createPhoto(CreatePhotoDTO createPhotoDTO) {
        var photo = new Photo();
        photo.setBase64(createPhotoDTO.base64());
        photo.setTakenAt(createPhotoDTO.takenAt());

        photoRepository.save(photo);
        return toGetPhotoDTO(photo);
    }

    public GetPhotoDTO updatePhoto(String id, UpdatePhotoDTO updatePhotoDTO) {
        var photo = photoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new DataNotFound("Photo not found"));

        photo.setBase64(updatePhotoDTO.base64());
        photo.setTakenAt(updatePhotoDTO.takenAt());

        photoRepository.save(photo);
        return toGetPhotoDTO(photo);
    }

    public void deletePhoto(String id) {
        var photo = photoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new DataNotFound("Photo not found"));
        photoRepository.delete(photo);
    }

    private GetPhotoDTO toGetPhotoDTO(Photo photo) {
        return new GetPhotoDTO(
                photo.getId(),
                photo.getBase64(),
                photo.getTakenAt());
    }
}
