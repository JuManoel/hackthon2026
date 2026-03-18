package edu.ucaldas.hackathon.services;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

@Component
public class CameraMonitoringSubscriptionTracker {

    private static final String CAMERA_MONITORING_TOPIC = "/topic/camera/monitoring/recent";

    private final ConcurrentMap<String, Set<String>> sessionSubscriptions = new ConcurrentHashMap<>();

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        var accessor = StompHeaderAccessor.wrap(event.getMessage());
        var destination = accessor.getDestination();
        var sessionId = accessor.getSessionId();
        var subscriptionId = accessor.getSubscriptionId();

        if (!CAMERA_MONITORING_TOPIC.equals(destination) || sessionId == null || subscriptionId == null) {
            return;
        }

        sessionSubscriptions
                .computeIfAbsent(sessionId, key -> ConcurrentHashMap.newKeySet())
                .add(subscriptionId);
    }

    @EventListener
    public void handleUnsubscribe(SessionUnsubscribeEvent event) {
        var accessor = StompHeaderAccessor.wrap(event.getMessage());
        var sessionId = accessor.getSessionId();
        var subscriptionId = accessor.getSubscriptionId();

        if (sessionId == null || subscriptionId == null) {
            return;
        }

        var subscriptions = sessionSubscriptions.get(sessionId);
        if (subscriptions == null) {
            return;
        }

        subscriptions.remove(subscriptionId);
        if (subscriptions.isEmpty()) {
            sessionSubscriptions.remove(sessionId);
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        var accessor = StompHeaderAccessor.wrap(event.getMessage());
        var sessionId = accessor.getSessionId();
        if (sessionId != null) {
            sessionSubscriptions.remove(sessionId);
        }
    }

    public boolean hasActiveSubscribers() {
        return sessionSubscriptions.values().stream().anyMatch(subscriptions -> !subscriptions.isEmpty());
    }

    public int getActiveSubscriptionsCount() {
        return sessionSubscriptions.values().stream().mapToInt(Set::size).sum();
    }
}
