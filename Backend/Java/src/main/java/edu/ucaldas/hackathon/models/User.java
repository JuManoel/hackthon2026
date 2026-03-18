package edu.ucaldas.hackathon.models;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import edu.ucaldas.hackathon.DTOs.users.CreateUserDTO;
import edu.ucaldas.hackathon.DTOs.users.GetUserDTO;
import edu.ucaldas.hackathon.DTOs.users.UpdateUserDTO;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(unique = true)
    private String username;

    private String password;
    @Enumerated(EnumType.STRING)
    private Role role;

    public User(CreateUserDTO createUserDTO) {
        this.username = createUserDTO.username();
        this.password = createUserDTO.password();
        this.role = Role.valueOf(createUserDTO.role());
    }

    public void update(UpdateUserDTO updateUserDTO) {
        this.username = updateUserDTO.username();
        if (updateUserDTO.password() != null && !updateUserDTO.password().isEmpty()) {
            this.password = updateUserDTO.password();
        }
        this.role = Role.valueOf(updateUserDTO.role());
    }

    public GetUserDTO toGetUserDTO() {
        return new GetUserDTO(this.id, this.username, this.role.name());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        switch (this.role) {
            case ADMIN:
                return List.of(new SimpleGrantedAuthority("ADMIN"));
            case GUIDE:
                return List.of(new SimpleGrantedAuthority("GUIDE"));

            default:
                return List.of();
        }
    }
}
