package edu.ucaldas.hackathon.models;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "birds")
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class Bird {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "probability_yolo", precision = 5, scale = 2, nullable = false)
    private BigDecimal probabilityYolo;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "species_id", nullable = false)
    private Species species;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "photo_id", nullable = false)
    private Photo photo;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "camera_id", nullable = false, foreignKey = @jakarta.persistence.ForeignKey(name = "fk_birds_camera_id"))
    private Camera camera;

}
