package edu.ucaldas.hackathon.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.service.annotation.DeleteExchange;

import edu.ucaldas.hackathon.DTOs.camera.CreateCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.GetCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.MonitoringSocketStatusDTO;
import edu.ucaldas.hackathon.DTOs.camera.UpdateCameraDTO;
import edu.ucaldas.hackathon.services.CameraMonitoringSubscriptionTracker;
import edu.ucaldas.hackathon.services.CameraService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;



@RestController
@RequestMapping("/camera")
public class CameraController {
    @Autowired
    private CameraService cameraService;

    @Autowired
    private CameraMonitoringSubscriptionTracker subscriptionTracker;

    @GetMapping("/{id}")
    public ResponseEntity<GetCameraDTO> getCamera(@PathVariable String id) {
        var camera = cameraService.getCameraById(id);
        return ResponseEntity.ok(camera);
    }

    @GetMapping("")
    public ResponseEntity<List<GetCameraDTO>> getAllCameras() {
        var cameras = cameraService.getAllCameras();
        return ResponseEntity.ok(cameras);
    }

    @GetMapping("/monitoring/status")
    public ResponseEntity<MonitoringSocketStatusDTO> getMonitoringSocketStatus() {
        var response = new MonitoringSocketStatusDTO(
                subscriptionTracker.hasActiveSubscribers(),
                subscriptionTracker.getActiveSubscriptionsCount());
        return ResponseEntity.ok(response);
    }


    @PostMapping("")
    public ResponseEntity<GetCameraDTO> createCamera(@RequestBody CreateCameraDTO createCameraDTO) {
        var camera = cameraService.createCamera(createCameraDTO);
        return ResponseEntity.created(URI.create("/camera/" + camera.id())).body(camera);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GetCameraDTO> updateCamera(@PathVariable String id, @RequestBody UpdateCameraDTO updateCameraDTO) {
        var camera = cameraService.updateCamera(id, updateCameraDTO);
        return ResponseEntity.ok(camera);
    }

    @DeleteExchange("/{id}")
    public ResponseEntity<String> deleteCamera(@PathVariable String id) {
        cameraService.deleteCamera(id);
        return ResponseEntity.noContent().build();
    }

}
