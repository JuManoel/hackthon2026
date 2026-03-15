package edu.ucaldas.hackathon.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.ucaldas.hackathon.models.Camara;

@Repository
public interface ICamaraRepository extends JpaRepository<Camara, String> {
    
}
