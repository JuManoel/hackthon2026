package edu.ucaldas.hackathon.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.service.annotation.DeleteExchange;

import edu.ucaldas.hackathon.DTOs.camara.CreateCamaraDTO;
import edu.ucaldas.hackathon.DTOs.camara.GetCamaraDTO;
import edu.ucaldas.hackathon.DTOs.camara.UpdateCamaraDTO;
import edu.ucaldas.hackathon.services.CamaraService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;



@RestController
@RequestMapping("/camara")
public class CamaraController {
    @Autowired
    private CamaraService camaraService;

    @GetMapping("/{id}")
    public ResponseEntity<GetCamaraDTO> getCamara(@PathVariable String id) {
        var camara = camaraService.getCamaraById(id);
        return ResponseEntity.ok(camara);
    }

    @GetMapping("")
    public ResponseEntity<List<GetCamaraDTO>> getAllCamaras() {
        var camaras = camaraService.getAllCamaras();
        return ResponseEntity.ok(camaras);
    }
    

    @PostMapping("")
    public ResponseEntity<GetCamaraDTO> createCamara(@RequestBody CreateCamaraDTO createCamaraDTO) {
        var camara = camaraService.createCamara(createCamaraDTO);
        return ResponseEntity.created(URI.create("/camara/" + camara.id())).body(camara);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GetCamaraDTO> updateCamara(@PathVariable String id, @RequestBody UpdateCamaraDTO updateCamaraDTO) {
        var camara = camaraService.updateCamara(id, updateCamaraDTO);
        return ResponseEntity.ok(camara);
    }

    @DeleteExchange("/{id}")
    public ResponseEntity<String> deleteCamara(@PathVariable String id) {
        camaraService.deleteCamara(id);
        return ResponseEntity.noContent().build();
    }

}
