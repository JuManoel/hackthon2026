package edu.ucaldas.hackathon.DTOs.camera;

public record MonitoringSocketStatusDTO(
        boolean hasActiveSubscribers,
        int activeSubscriptionsCount) {
}
