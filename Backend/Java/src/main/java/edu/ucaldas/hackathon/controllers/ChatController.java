package edu.ucaldas.hackathon.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ucaldas.hackathon.DTOs.chat.ChatRequestDTO;
import edu.ucaldas.hackathon.DTOs.chat.ChatResponseDTO;
import edu.ucaldas.hackathon.services.ChatService;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/ask")
    public ResponseEntity<ChatResponseDTO> ask(@RequestBody ChatRequestDTO request) {
        String response = chatService.askTororoi(request.message());
        return ResponseEntity.ok(new ChatResponseDTO(response));
    }
}

