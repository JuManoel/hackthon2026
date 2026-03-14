package edu.ucaldas.hackathon.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import edu.ucaldas.hackathon.DTOs.CreateUserDTO;
import edu.ucaldas.hackathon.DTOs.GetUserDTO;
import edu.ucaldas.hackathon.DTOs.UpdateUserDTO;
import edu.ucaldas.hackathon.models.User;
import edu.ucaldas.hackathon.repositories.IUserRepository;
import jakarta.transaction.Transactional;

@Service
public class UserService {
    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void createUser(CreateUserDTO createUserDTO) {
        var user = new User(createUserDTO);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if(userRepository.existsByUsername(user.getUsername())){
            throw new RuntimeException("Username already exists");
        }
        userRepository.save(user);
    }

    public GetUserDTO getUserById(String id) {
        var user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        return user.toGetUserDTO();
    }

    public GetUserDTO getUserByUsername(String username) {
        var user = userRepository.getUserByUsername(username);
        return user.toGetUserDTO();
    }

    @Transactional
    public GetUserDTO updateUser(String id, UpdateUserDTO updateUserDTO) {
        var user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.update(updateUserDTO);
        if(updateUserDTO.password() != null && !updateUserDTO.password().isEmpty()){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        userRepository.save(user);
        return user.toGetUserDTO();
    }

    @Transactional
    public void deleteUser(String id) {
        var user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }
}
