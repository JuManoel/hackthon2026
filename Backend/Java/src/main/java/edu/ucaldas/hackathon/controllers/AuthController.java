package edu.ucaldas.hackathon.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import edu.ucaldas.hackathon.DTOs.LoginDTO;
import edu.ucaldas.hackathon.DTOs.MeDTO;
import edu.ucaldas.hackathon.DTOs.TokenDTO;
import edu.ucaldas.hackathon.models.User;
import edu.ucaldas.hackathon.services.TokenService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<TokenDTO> login(@RequestBody LoginDTO loginDTO) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(loginDTO.username(),
                loginDTO.password());
        var userAuthenticated = authenticationManager.authenticate(authentication);
        var user = (User) userAuthenticated.getPrincipal(); // Retrieve the User object
        var token = tokenService.generateToken(user);
        TokenDTO tokenDTO = new TokenDTO(token);
        return ResponseEntity.ok(tokenDTO);
    }

    @GetMapping("/me")
    public ResponseEntity<MeDTO> getMe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        MeDTO meDTO = new MeDTO(user.getId(), user.getUsername(), user.getRole().toString());
        return ResponseEntity.ok(meDTO);
    }

}
