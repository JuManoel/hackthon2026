package edu.ucaldas.hackathon.models;

import java.math.BigDecimal;
import java.util.UUID;

import edu.ucaldas.hackathon.DTOs.camera.CreateCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.GetCameraDTO;
import edu.ucaldas.hackathon.DTOs.camera.UpdateCameraDTO;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "camaras")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Camera {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false)
    private UUID id;

    private String name;
    @Column(name = "angle_xy", precision = 5, scale = 2)
    private BigDecimal angleXY;
    @Column(name = "angle_xz", precision = 5, scale = 2)
    private BigDecimal angleXZ;

    @OneToOne(fetch = FetchType.EAGER, mappedBy = "camera", cascade = CascadeType.ALL, orphanRemoval = true)
    private Location location;

    public Camera(CreateCameraDTO createCameraDTO) {
        this.name = createCameraDTO.name();
        this.angleXY = createCameraDTO.angleXY();
        this.angleXZ = createCameraDTO.angleXZ();
        this.setLocation(new Location(createCameraDTO.location()));
    }

    public GetCameraDTO toGetCameraDTO() {
        return new GetCameraDTO(
                this.id,
                this.name,
                this.angleXY,
                this.angleXZ,
                this.location.toGetLocationDTO());
    }

    public void update(UpdateCameraDTO updateCameraDTO) {
        this.name = updateCameraDTO.name();
        this.angleXY = updateCameraDTO.angleXY();
        this.angleXZ = updateCameraDTO.angleXZ();
        this.location.update(updateCameraDTO.location());
    }

    public void setLocation(Location location) {
        this.location = location;
        if (location != null) {
            location.setCamera(this);
        }
    }
}
