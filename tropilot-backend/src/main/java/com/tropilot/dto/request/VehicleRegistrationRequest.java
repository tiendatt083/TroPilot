package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VehicleRegistrationRequest {

    @NotBlank(message = "Owner type is required")
    @Size(max = 30, message = "Owner type must not exceed 30 characters")
    private String ownerType;

    @Size(max = 120, message = "Owner name must not exceed 120 characters")
    private String ownerName;

    @NotBlank(message = "Vehicle type is required")
    @Size(max = 30, message = "Vehicle type must not exceed 30 characters")
    private String vehicleType;

    @NotBlank(message = "License plate is required")
    @Size(max = 30, message = "License plate must not exceed 30 characters")
    private String licensePlate;

    @Size(max = 80, message = "Brand must not exceed 80 characters")
    private String brand;

    @Size(max = 40, message = "Color must not exceed 40 characters")
    private String color;

    private LocalDate startDate;

    private LocalDate endDate;
}
