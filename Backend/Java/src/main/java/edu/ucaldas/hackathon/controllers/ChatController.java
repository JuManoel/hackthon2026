package edu.ucaldas.hackathon.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import edu.ucaldas.hackathon.DTOs.chat.ChatResponseDTO;
import edu.ucaldas.hackathon.services.ChatService;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping(value = "/ask", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatResponseDTO> ask(
            @RequestPart(value = "message", required = false) String message,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        String response = chatService.askTororoi(message, image);
        return ResponseEntity.ok(new ChatResponseDTO(response));
    }
}
