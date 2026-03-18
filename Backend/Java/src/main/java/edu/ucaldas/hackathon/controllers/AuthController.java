package edu.ucaldas.hackathon.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import edu.ucaldas.hackathon.DTOs.login.LoginDTO;
import edu.ucaldas.hackathon.DTOs.login.MeDTO;
import edu.ucaldas.hackathon.DTOs.login.TokenDTO;
import edu.ucaldas.hackathon.models.User;
import edu.ucaldas.hackathon.services.TokenService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/auth")
@Tag(name = "Autenticación", description = "Endpoints para autenticación y gestión de tokens JWT")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    @Operation(
        summary = "Autenticar usuario",
        description = "Realiza la autenticación del usuario y genera un token JWT válido por 24 horas"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Autenticación exitosa",
            content = @Content(schema = @Schema(implementation = TokenDTO.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Credenciales inválidas"
        )
    })
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
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
        summary = "Obtener información del usuario autenticado",
        description = "Retorna la información del usuario actualmente autenticado"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Información del usuario",
            content = @Content(schema = @Schema(implementation = MeDTO.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "No autenticado - Token inválido o ausente"
        )
    })
    public ResponseEntity<MeDTO> getMe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        MeDTO meDTO = new MeDTO(user.getId(), user.getUsername(), user.getRole().toString());
        return ResponseEntity.ok(meDTO);
    }

}
