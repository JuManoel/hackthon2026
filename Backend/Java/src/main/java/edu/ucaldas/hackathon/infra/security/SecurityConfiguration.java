package edu.ucaldas.hackathon.infra.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(
                            "/swagger-ui.html",
                            "/swagger-ui/**",
                            "/v3/api-docs/**").permitAll();
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/auth/login").permitAll();
                    auth.requestMatchers("/ws/**", "/ws").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/camera/monitoring/status").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/user").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/camera").hasAnyAuthority("ADMIN");
                    auth.requestMatchers(HttpMethod.PUT, "/camera/**").hasAnyAuthority("ADMIN");
                    auth.requestMatchers(HttpMethod.DELETE, "/camera/**").hasAnyAuthority("ADMIN");
                    auth.requestMatchers("/bird").permitAll();
                    auth.requestMatchers("/bird/**").permitAll();
                    auth.requestMatchers("/photo").permitAll();
                    auth.requestMatchers("/photo/**").permitAll();
                    auth.anyRequest().authenticated();
                })
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class).build(); // filter
    }

    /**
     * Exposes the {@link AuthenticationManager} bean to be used for authentication
     * processes.
     * 
     * @param authenticationConfiguration the configuration object that provides the
     *                                    authentication manager
     * @return the {@link AuthenticationManager} instance
     * @throws Exception if an error occurs while retrieving the authentication
     *                   manager
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * Defines a {@link PasswordEncoder} bean that uses the BCrypt hashing
     * algorithm.
     * <p>
     * BCrypt is a strong and adaptive hashing function recommended for securely
     * storing passwords.
     * This bean can be injected wherever password encoding or verification is
     * required.
     *
     * @return a {@link BCryptPasswordEncoder} instance for password hashing and
     *         verification
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}