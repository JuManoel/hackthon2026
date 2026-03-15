package edu.ucaldas.hackathon.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import edu.ucaldas.hackathon.models.User;

@Repository
public interface IUserRepository extends JpaRepository<User, UUID> {
    UserDetails findByUsername(String username);

    boolean existsByUsername(String username);
}
