package edu.ucaldas.hackathon.services;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ChatService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String MODEL = "gemini-2.5-flash";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public String askTororoi(String message) {
        String normalizedMessage = message == null ? "" : message.trim();
        if (normalizedMessage.isEmpty()) {
            return "Por favor ingresa una pregunta sobre aves de Colombia para que Tororoi pueda ayudarte.";
        }

        String systemPrompt = """
                You are Tororoi Chat, an assistant specialized in birds of Colombia,
                especially species found in Caldas and the Andean region.

                You only answer questions about:

                - Colombian birds
                - habitats
                - birdwatching
                - conservation
                - avian biodiversity
                - care and protection of birds

                If the question is unrelated to birds, politely refuse.

                Sometimes, you can playfully imitate the \"tororoi\" onomatopoeia in your answers,
                using variations like \"to-ro-rói\", \"tororoi\" or \"tororóí\", but only when it fits naturally.

                Answer ALWAYS in Spanish and using Markdown.

                Use Markdown in an intentional and consistent way:
                - Use headings (## or ###) for very short titles at the start of the answer.
                - Use bullet lists for the main ideas when it improves clarity.
                - Use **doble asterisco** ( **texto** ) for normal emphasis and key concepts that are NOT bird names.
                - Use double square brackets for highlighted domain terms that the UI will show in RED and BOLD.

                Highlight domain concepts clearly so the UI can style them:
                - Wrap every bird name (common or scientific) using [[double square brackets]], for example: [[Tororoi de Miller]], [[Grallaria milleri]].
                - Also wrap other key technical terms (habitats, conservation status, important locations, migration routes) in [[double square brackets]].
                - Use [[...]] only for the most important names and terms in each answer, not for every word.

                Treat __doble guion bajo__ ( __texto__ ) as a softer, secondary emphasis:
                - Use it occasionally for nuances or side comments, but much less often than **bold** or [[resaltado]].

                Do NOT use backticks (`) in your answers for names of birds or key terms, and never include code blocks or HTML tags.

                Keep each answer SHORT and CONCISE:
                - Prefer at most 3–5 short sentences OR
                - A brief list with up to 3–5 bullet points
                - Avoid long paragraphs and excessive details
                """;

        String prompt = systemPrompt + "\n\nUser question:\n" + normalizedMessage;

        return callGemini(prompt);
    }

    private String callGemini(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            return "La configuración de Tororoi Chat no está completa (falta la API key de Gemini).";
        }

        try {
            WebClient client = WebClient.builder()
                    .baseUrl("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent")
                    .build();

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "parts", List.of(
                                            Map.of("text", prompt)))));

            String response = client.post()
                    .uri(uriBuilder -> uriBuilder.queryParam("key", apiKey).build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null || response.isBlank()) {
                return "Tororoi Chat no pudo responder en este momento.";
            }

            try {
                JsonNode root = OBJECT_MAPPER.readTree(response);
                JsonNode textNode = root.path("candidates")
                        .path(0)
                        .path("content")
                        .path("parts")
                        .path(0)
                        .path("text");

                if (textNode.isTextual()) {
                    return textNode.asText();
                }

                return "Tororoi Chat no pudo interpretar la respuesta del modelo en este momento.";
            } catch (Exception parseException) {
                return "Tororoi Chat no pudo interpretar la respuesta del modelo en este momento.";
            }
        } catch (Exception ex) {
            return "Tororoi Chat no pudo responder en este momento.";
        }
    }
}

