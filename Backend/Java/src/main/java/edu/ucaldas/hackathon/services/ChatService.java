package edu.ucaldas.hackathon.services;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ChatService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${python.backend.url:http://localhost:8000}")
    private String pythonBackendUrl;

    private static final String MODEL = "gpt-4o-mini";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_FUNCTION_CALLS = 3;

    public String askTororoi(String message, MultipartFile image) {
        String normalizedMessage = message == null ? "" : message.trim();
        if (normalizedMessage.isEmpty() && image == null) {
            return "Por favor ingresa una pregunta sobre aves de Colombia para que Tororoi pueda ayudarte.";
        }

        try {
            List<Map<String, Object>> conversationHistory = new ArrayList<>();

            // System prompt
            conversationHistory.add(Map.of("role", "system", "content", getSystemPrompt()));

            // Add user message with optional image
            Map<String, Object> userMessage = buildUserMessage(normalizedMessage, image);
            conversationHistory.add(userMessage);

            // Call OpenAI with function calling capability
            return callOpenAIWithFunctionCalling(conversationHistory, image);
        } catch (Exception ex) {
            return "Tororoi Chat no pudo responder en este momento.";
        }
    }

    private Map<String, Object> buildUserMessage(String text, MultipartFile image) throws Exception {
        List<Map<String, Object>> content = new ArrayList<>();

        if (text != null && !text.isEmpty()) {
            content.add(Map.of("type", "text", "text", text));
        }

        if (image != null && !image.isEmpty()) {
            String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
            String dataUrl = "data:" + image.getContentType() + ";base64," + base64Image;
            content.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", dataUrl)));
        }

        return Map.of(
                "role", "user",
                "content", content);
    }

    private String callOpenAIWithFunctionCalling(List<Map<String, Object>> conversationHistory, MultipartFile image) {
        if (apiKey == null || apiKey.isBlank()) {
            return "La configuración de Tororoi Chat no está completa (falta la API key de OpenAI).";
        }

        WebClient client = WebClient.builder()
                .baseUrl("https://api.openai.com/v1/chat/completions")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();

        int functionCallCount = 0;

        while (functionCallCount < MAX_FUNCTION_CALLS) {
            try {
                // Build request
                Map<String, Object> requestBody = Map.of(
                        "model", MODEL,
                        "messages", conversationHistory,
                        "tools", List.of(Map.of(
                                "type", "function",
                                "function", buildAnalyzeBirdImageTool())));

                String response = client.post()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                if (response == null || response.isBlank()) {
                    return "Tororoi Chat no pudo responder en este momento.";
                }

                JsonNode root = OBJECT_MAPPER.readTree(response);
                JsonNode messageNode = root.path("choices").path(0).path("message");

                // Check if it's a function call
                if (messageNode.has("tool_calls") && messageNode.path("tool_calls").isArray()
                        && messageNode.path("tool_calls").size() > 0) {
                    functionCallCount++;

                    // Add assistant's tool call message to history to maintain context
                    @SuppressWarnings("unchecked")
                    Map<String, Object> assistantMessage = OBJECT_MAPPER.convertValue(messageNode, Map.class);
                    conversationHistory.add(assistantMessage);

                    JsonNode toolCall = messageNode.path("tool_calls").path(0);
                    String functionName = toolCall.path("function").path("name").asText();
                    String toolCallId = toolCall.path("id").asText();

                    if ("analyze_bird_image".equals(functionName)) {
                        // Execute the function
                        String functionResult = executeBirdImageAnalysis(image);

                        // Add function response to history
                        conversationHistory.add(Map.of(
                                "role", "tool",
                                "tool_call_id", toolCallId,
                                "name", functionName,
                                "content", functionResult));

                        // Continue the loop to get final response
                        continue;
                    }
                }

                // It's a text response - return it
                JsonNode contentNode = messageNode.path("content");
                if (contentNode.isTextual() && !contentNode.isNull()) {
                    return contentNode.asText();
                }

                return "Tororoi Chat no pudo interpretar la respuesta del modelo en este momento.";

            } catch (Exception ex) {
                return "Tororoi Chat no pudo responder en este momento: " + ex.getMessage();
            }
        }

        return "Tororoi Chat alcanzó el límite de llamadas a funciones.";
    }

    private Map<String, Object> buildAnalyzeBirdImageTool() {
        return Map.of(
                "name", "analyze_bird_image",
                "description", "Analiza una imagen de ave usando el modelo de visión por computadora YOLO. " +
                        "Retorna la especie detectada, nivel de confianza, y coordenadas del bounding box. " +
                        "Usa esta función cuando el usuario envíe una imagen y quiera saber qué ave es.",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "request_analysis", Map.of(
                                        "type", "boolean",
                                        "description", "Solicitar análisis de la imagen")),
                        "required", List.of("request_analysis")));
    }

    private String executeBirdImageAnalysis(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return "No se proporcionó ninguna imagen para analizar.";
        }

        try {
            WebClient pythonClient = WebClient.builder()
                    .baseUrl(pythonBackendUrl)
                    .build();

            // Send image to Python backend via the dedicated chat endpoint
            String response = pythonClient.post()
                    .uri("/analizar_foto_chat")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .bodyValue(org.springframework.util.LinkedMultiValueMap.class.cast(
                            new org.springframework.util.LinkedMultiValueMap<String, Object>() {
                                {
                                    add("archivo", image.getResource());
                                }
                            }))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null || response.isBlank()) {
                return "El servicio de análisis de imágenes no pudo procesar la imagen.";
            }

            // Parse and format the response
            JsonNode result = OBJECT_MAPPER.readTree(response);
            int birdsFound = result.path("aves_encontradas").asInt(0);

            if (birdsFound == 0) {
                return "No se detectaron aves en la imagen con suficiente confianza.";
            }

            JsonNode detalles = result.path("detalles");
            if (detalles.isEmpty() || !detalles.isArray()) {
                return "No se pudo extraer información de las aves detectadas.";
            }

            // Get first detection
            JsonNode firstDetection = detalles.get(0);
            String species = firstDetection.path("especie").asText("Desconocida");
            double confidence = firstDetection.path("score_final")
                    .asDouble(firstDetection.path("confianza").asDouble(0.0));

            return String.format(
                    "Análisis completado: Se detectaron %d ave(s). Primera detección: %s con %.2f%% de confianza.",
                    birdsFound, species, confidence);

        } catch (Exception ex) {
            return "Error al analizar la imagen: " + ex.getMessage();
        }
    }

    private String getSystemPrompt() {
        return """
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

                Sometimes, you can playfully imitate the "tororoi" onomatopoeia in your answers,
                using variations like "to-ro-rói", "tororoi" or "tororóí", but only when it fits naturally.

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

                When a user sends an image of a bird, use the analyze_bird_image function to identify the species.
                After receiving the analysis, explain what bird was detected and provide interesting facts about it.
                """;
    }
}
