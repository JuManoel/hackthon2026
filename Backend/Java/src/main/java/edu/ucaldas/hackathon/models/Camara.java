package edu.ucaldas.hackathon.models;

import java.math.BigDecimal;
import java.util.UUID;

import edu.ucaldas.hackathon.DTOs.camara.CreateCamaraDTO;
import edu.ucaldas.hackathon.DTOs.camara.GetCamaraDTO;
import edu.ucaldas.hackathon.DTOs.camara.UpdateCamaraDTO;
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
public class Camara {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false)
    private UUID id;
    private String name;
    @Column(name = "angle_xy", precision = 5, scale = 2)
    private BigDecimal angleXY;
    @Column(name = "angle_xz", precision = 5, scale = 2)
    private BigDecimal angleXZ;

    @OneToOne(fetch = FetchType.EAGER, mappedBy = "camara", cascade = CascadeType.ALL, orphanRemoval = true)
    private Location location;

    public Camara(CreateCamaraDTO createCamaraDTO) {
        this.name = createCamaraDTO.name();
        this.angleXY = createCamaraDTO.angleXY();
        this.angleXZ = createCamaraDTO.angleXZ();
        this.setLocation(new Location(createCamaraDTO.location()));
    }

    public GetCamaraDTO toGetCamaraDTO() {
        return new GetCamaraDTO(
                this.id,
                this.name,
                this.angleXY,
                this.angleXZ,
                this.location.toGetLocationDTO());
    }

    public void update(UpdateCamaraDTO updateCamaraDTO) {
        this.name = updateCamaraDTO.name();
        this.angleXY = updateCamaraDTO.angleXY();
        this.angleXZ = updateCamaraDTO.angleXZ();
        this.location.update(updateCamaraDTO.location());
    }

    public void setLocation(Location location) {
        this.location = location;
        if (location != null) {
            location.setCamara(this);
        }
    }
}
