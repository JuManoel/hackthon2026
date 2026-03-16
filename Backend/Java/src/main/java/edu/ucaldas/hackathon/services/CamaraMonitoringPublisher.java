package edu.ucaldas.hackathon.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class CamaraMonitoringPublisher {

    private final CamaraService camaraService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${monitoring.window-seconds:60}")
    private int windowSeconds;

    public CamaraMonitoringPublisher(CamaraService camaraService, SimpMessagingTemplate messagingTemplate) {
        this.camaraService = camaraService;
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(fixedDelayString = "${monitoring.broadcast-ms:1000}")
    public void publishRecentMonitoring() {
        var payload = camaraService.getMonitoringCamaras(windowSeconds);
        messagingTemplate.convertAndSend("/topic/camara/monitoring/recent", payload);
    }
}
