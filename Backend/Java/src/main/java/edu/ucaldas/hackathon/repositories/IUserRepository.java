package edu.ucaldas.hackathon.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.security.core.userdetails.UserDetails;

import edu.ucaldas.hackathon.models.User;

public interface IUserRepository extends JpaRepository<User, String>{
    UserDetails findByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.username = :username")
    User getUserByUsername(String username);

    boolean existsByUsername(String username);
}
