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

import edu.ucaldas.hackathon.DTOs.photo.CreatePhotoDTO;
import edu.ucaldas.hackathon.DTOs.photo.GetPhotoDTO;
import edu.ucaldas.hackathon.DTOs.photo.UpdatePhotoDTO;
import edu.ucaldas.hackathon.services.PhotoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/photo")
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    @GetMapping("/{id}")
    public ResponseEntity<GetPhotoDTO> getPhoto(@PathVariable String id) {
        var photo = photoService.getPhotoById(id);
        return ResponseEntity.ok(photo);
    }

    @GetMapping("")
    public ResponseEntity<List<GetPhotoDTO>> getAllPhotos() {
        var photos = photoService.getAllPhotos();
        return ResponseEntity.ok(photos);
    }

    @PostMapping("")
    public ResponseEntity<GetPhotoDTO> createPhoto(@Valid @RequestBody CreatePhotoDTO createPhotoDTO) {
        var photo = photoService.createPhoto(createPhotoDTO);
        return ResponseEntity.created(URI.create("/photo/" + photo.id())).body(photo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GetPhotoDTO> updatePhoto(@PathVariable String id, @Valid @RequestBody UpdatePhotoDTO updatePhotoDTO) {
        var photo = photoService.updatePhoto(id, updatePhotoDTO);
        return ResponseEntity.ok(photo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePhoto(@PathVariable String id) {
        photoService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }
}
