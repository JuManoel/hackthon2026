package edu.ucaldas.hackathon.services;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

import edu.ucaldas.hackathon.infra.exception.ErrorToken;
import edu.ucaldas.hackathon.infra.exception.MissingToken;
import edu.ucaldas.hackathon.models.User;

import org.springframework.beans.factory.annotation.Value;

/**
 * Service class responsible for generating and validating JWT tokens for user authentication.
 */
@Service
public class TokenService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${app.timezone.offset}")
    private String timezoneOffset;

    public String generateToken(User user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secretKey);
            return JWT.create()
                    .withIssuer("hackathon-2026")
                    .withSubject(user.getUsername())
                    .withClaim("id", user.getId().toString())
                    .withClaim("username", user.getUsername())
                    .withClaim("role", user.getRole().name())
                    .withExpiresAt(generateExpliration())
                    .sign(algorithm);
        } catch (Exception e) {
            throw new ErrorToken("Error generating token");
        }
    }

    public Instant generateExpliration() {
        return LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of(timezoneOffset));
    }

    public String getSubject(String token) {
        if (token == null || token.isEmpty()) {
            throw new MissingToken("Token not found");
        }
        DecodedJWT decodedJWT = null;
        try {
            Algorithm algorithm = Algorithm.HMAC256(secretKey);
            decodedJWT = JWT.require(algorithm).withIssuer("hackathon-2026").build().verify(token);
            return decodedJWT.getSubject();
        } catch (JWTVerificationException e) {
            throw new ErrorToken("Invalid token: " + e.getMessage());
        }
    }

}
