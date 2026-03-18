package edu.ucaldas.hackathon.infra.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import edu.ucaldas.hackathon.repositories.IUserRepository;
import edu.ucaldas.hackathon.services.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


/**
 * SecurityFilter is a Spring component that intercepts HTTP requests to perform JWT-based authentication.
 * <p>
 * This filter extends {@link OncePerRequestFilter} to ensure it is executed once per request.
 * It checks for the presence of an "Authorization" header containing a Bearer token. If a valid token is found,
 * it extracts the user's email from the token, retrieves the corresponding user details from the repository,
 * and sets the authentication in the Spring Security context. If the user is not found, inactive, or the token is invalid,
 * appropriate exceptions are thrown to prevent unauthorized access.
 * </p>
 *
 * <p>
 * Dependencies:
 * <ul>
 *   <li>{@link TokenService} for validating and extracting information from JWT tokens.</li>
 *   <li>{@link IUserRepository} for retrieving user details based on email and active status.</li>
 * </ul>
 * </p>
 *
 * <p>
 * Typical usage involves registering this filter in the Spring Security filter chain to secure endpoints
 * using JWT authentication.
 * </p>
 *
 * @author juan-manoel
 */
@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService; // Assuming you have a TokenService for token validation

    @Autowired
    private IUserRepository userRepository; // Assuming you have a UserRepository for user details


    /**
     * Processes incoming HTTP requests to handle JWT-based authentication.
     * <p>
     * This filter checks for the presence of an "Authorization" header with a Bearer token.
     * If a valid token is found, it extracts the user's email from the token, retrieves the user details,
     * and sets the authentication in the security context. If the user is not found or inactive,
     * or if the token is invalid, appropriate exceptions are thrown.
     * </p>
     *
     * @param request      the incoming {@link HttpServletRequest}
     * @param response     the outgoing {@link HttpServletResponse}
     * @param filterChain  the {@link FilterChain} to pass the request and response to the next filter
     * @throws IOException      if an input or output error occurs during filtering
     * @throws ServletException if the request could not be handled
     */
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws IOException, ServletException {
        var authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            var token = authorizationHeader.replace("Bearer ", "");
            try {
                var username = tokenService.getSubject(token);
                UserDetails user = userRepository.findByUsername(username);
                if (user != null) {
                    var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    sendErrorResponse(response, HttpStatus.NOT_FOUND, "User not found");
                    return;
                }
            } catch (RuntimeException e) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, e.getMessage());
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"" + message + "\",\"status\":\"" + status.value() + "\"}");
    }

}
