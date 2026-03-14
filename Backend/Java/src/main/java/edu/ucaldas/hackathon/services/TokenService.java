package edu.ucaldas.hackathon.services;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

import edu.ucaldas.hackathon.models.User;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Value;

/**
 * Service class responsible for generating and validating JWT tokens for user authentication.
 * <p>
 * This service provides methods to create JWT tokens containing user information and to extract
 * the subject (typically the user's email or identifier) from a given token. Tokens are signed
 * using the HMAC256 algorithm and a configurable secret key, and include claims such as user ID
 * and name. The service also handles token expiration and validation.
 * </p>
 *
 * <p>
 * Example usage:
 * <pre>
 *     String token = tokenService.generateToken(user);
 *     String subject = tokenService.getSubject(token);
 * </pre>
 * </p>
 *
 * @author juan-manoel
 */
@Service
public class TokenService {

    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * Generates a JWT token for the specified user.
     * <p>
     * The token includes the user's email as the subject, and adds claims for the user's ID and name.
     * The token is signed using the HMAC256 algorithm with a secret key and is set to expire at a specific time.
     * </p>
     *
     * @param user the {@link User} object for whom the token is generated
     * @return a signed JWT token as a {@link String}
     * @throws RuntimeException if an error occurs during token generation
     */
    public String generateToken(User user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secretKey);
            return JWT.create()
                    .withIssuer("hackathon-2026")
                    .withSubject(user.getUsername())
                    .withClaim("id", user.getId())
                    .withClaim("username", user.getUsername())
                    .withClaim("role", user.getRole().name())
                    .withExpiresAt(generateExpliration())
                    .sign(algorithm);
        } catch (Exception e) {
            throw new RuntimeException("Error generating token", e);
        }
    }

    public Instant generateExpliration() {
        return LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of("-05:00"));
    }


    /**
     * Extracts and returns the subject (typically the user identifier) from a given JWT token.
     * <p>
     * This method verifies the provided JWT token using the HMAC256 algorithm and a predefined secret key.
     * If the token is valid and issued by "hackathon-2026", it returns the subject claim from the token.
     * </p>
     *
     * @param token the JWT token from which to extract the subject
     * @return the subject contained in the JWT token
     * @throws EntityNotFoundException if the token is null or empty
     * @throws RuntimeException if the token cannot be decoded or is invalid
     */
    public String getSubject(String token) {
        if (token == null || token.isEmpty()) {
            throw new EntityNotFoundException("Token not found");
        }
        DecodedJWT decodedJWT = null;
        try {
            Algorithm algorithm = Algorithm.HMAC256(secretKey);
            decodedJWT = JWT.require(algorithm).withIssuer("hackathon-2026").build().verify(token);
            return decodedJWT.getSubject();
        } catch (JWTVerificationException e) {
            System.out.println("Invalid token: " + e.getMessage());
        }

        if (decodedJWT == null) {
            throw new RuntimeException("Error decoding token");
        }

        return decodedJWT.getSubject();

    }

}
