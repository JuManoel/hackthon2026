package edu.ucaldas.hackathon.services;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.users.CreateUserDTO;
import edu.ucaldas.hackathon.DTOs.users.GetUserDTO;
import edu.ucaldas.hackathon.DTOs.users.UpdateUserDTO;
import edu.ucaldas.hackathon.infra.exception.DataNotFound;
import edu.ucaldas.hackathon.infra.exception.EntityAlreadyExists;
import edu.ucaldas.hackathon.models.User;
import edu.ucaldas.hackathon.repositories.IUserRepository;
import jakarta.transaction.Transactional;

@Service
public class UserService {
    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public GetUserDTO createUser(CreateUserDTO createUserDTO) {
        var user = new User(createUserDTO);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new EntityAlreadyExists("Username already exists");
        }
        userRepository.save(user);
        return user.toGetUserDTO();
    }

    public GetUserDTO getUserById(String id) {
        var user = userRepository.findById(UUID.fromString(id)).orElseThrow(() -> new DataNotFound("User not found"));
        return user.toGetUserDTO();
    }

    @Transactional
    public GetUserDTO updateUser(String id, UpdateUserDTO updateUserDTO) {
        var user = userRepository.findById(UUID.fromString(id)).orElseThrow(() -> new DataNotFound("User not found"));
        user.update(updateUserDTO);
        if (updateUserDTO.password() != null && !updateUserDTO.password().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        userRepository.save(user);
        return user.toGetUserDTO();
    }

    @Transactional
    public void deleteUser(String id) {
        var user = userRepository.findById(UUID.fromString(id)).orElseThrow(() -> new DataNotFound("User not found"));
        userRepository.delete(user);
    }
}
