package edu.ucaldas.hackathon.models;

import java.math.BigDecimal;
import java.util.UUID;

import edu.ucaldas.hackathon.DTOs.camera.CreateLocationDTO;
import edu.ucaldas.hackathon.DTOs.camera.GetLocationDTO;
import edu.ucaldas.hackathon.DTOs.camera.UpdateLocationDTO;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "locations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false)
    private UUID id;

    private String region;
    private String address;
    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;
    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;
    @Column(precision = 5, scale = 2)
    private BigDecimal height;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camera_id", unique = true, nullable = false, columnDefinition = "UUID", foreignKey = @jakarta.persistence.ForeignKey(name = "fk_locations_camera_id"))
    private Camera camera;

    public Location(CreateLocationDTO createLocationDTO) {
        this.region = createLocationDTO.region();
        this.address = createLocationDTO.address();
        this.latitude = createLocationDTO.latitude();
        this.longitude = createLocationDTO.longitude();
        this.height = createLocationDTO.height();
    }

    public GetLocationDTO toGetLocationDTO() {
        return new GetLocationDTO(
                this.region,
                this.address,
                this.latitude,
                this.longitude,
                this.height);
    }

    public void update(UpdateLocationDTO updateLocationDTO) {
        this.region = updateLocationDTO.region();
        this.address = updateLocationDTO.address();
        this.latitude = updateLocationDTO.latitude();
        this.longitude = updateLocationDTO.longitude();
        this.height = updateLocationDTO.height();
    }

}
