package edu.ucaldas.hackathon.infra.springdoc;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * SpringDocConfiguration sets up the OpenAPI documentation for the application.
 * <p>
 * This configuration class defines a bean that customizes the OpenAPI specification
 * by adding a JWT Bearer authentication security scheme. The security scheme is
 * registered under the name "bearer-jwt" and specifies the use of HTTP bearer
 * authentication with JWT as the bearer format.
 * </p>
 *
 * <p>
 * This configuration also includes API metadata such as title, description,
 * version, contact information, and licensing details. API documentation tools
 * (such as Swagger UI) use this information to provide comprehensive API documentation
 * and facilitate secure API exploration and testing.
 * </p>
 *
 * @author juan-manoel
 */
@Configuration
public class SpringDocConfiguration {
	/**
	 * Configures the OpenAPI documentation for the application.
	 * <p>
	 * This bean customizes the OpenAPI specification by adding a security scheme
	 * for JWT Bearer authentication and API metadata. The security scheme is named "bearer-jwt"
	 * and uses the HTTP bearer authentication type with JWT as the bearer format.
	 *
	 * @return a customized {@link OpenAPI} instance with JWT bearer security scheme and API info.
	 */
	@Bean
	public OpenAPI customOpenAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("Hackathon 2026 - Bird Monitoring API")
						.description("API para monitoreo y clasificación de pájaros mediante cámaras inteligentes")
						.version("1.0.0")
						.contact(new Contact()
								.name("Equipo Hackathon")
								.email("support@hackathon.local")
								.url("https://github.com/JuManoel/hackthon2026"))
						.license(new License()
								.name("MIT")
								.url("https://opensource.org/licenses/MIT")))
				.addSecurityItem(new SecurityRequirement().addList("bearer-jwt"))
				.components(new Components()
						.addSecuritySchemes("bearer-jwt",
								new SecurityScheme()
										.type(SecurityScheme.Type.HTTP)
										.scheme("bearer")
										.bearerFormat("JWT")
										.description("JWT token obtenido del endpoint /auth/login")));
	}
}
