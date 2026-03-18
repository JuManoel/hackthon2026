package edu.ucaldas.hackathon.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class CameraMonitoringPublisher {

    private final CameraService cameraService;
    private final SimpMessagingTemplate messagingTemplate;
    private final CameraMonitoringSubscriptionTracker subscriptionTracker;

    @Value("${monitoring.window-seconds:60}")
    private int windowSeconds;

    public CameraMonitoringPublisher(
            CameraService cameraService,
            SimpMessagingTemplate messagingTemplate,
            CameraMonitoringSubscriptionTracker subscriptionTracker) {
        this.cameraService = cameraService;
        this.messagingTemplate = messagingTemplate;
        this.subscriptionTracker = subscriptionTracker;
    }

    @Scheduled(fixedDelayString = "${monitoring.broadcast-ms:1000}")
    public void publishRecentMonitoring() {
        if (!subscriptionTracker.hasActiveSubscribers()) {
            return;
        }

        var payload = cameraService.getMonitoringCameras(windowSeconds);
        messagingTemplate.convertAndSend("/topic/camera/monitoring/recent", payload);
    }
}
