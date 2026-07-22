package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminVehicleCreateRequest {

    @NotNull(message = "Room is required")
    private Long roomId;

    @NotNull(message = "Head Resident is required")
    private Long residentHeadId;

    private Long roomMemberId;

    @NotBlank(message = "Owner type is required")
    @Size(max = 30, message = "Owner type must not exceed 30 characters")
    private String ownerType;

    @NotBlank(message = "Vehicle type is required")
    @Size(max = 30, message = "Vehicle type must not exceed 30 characters")
    private String vehicleType;

    @NotBlank(message = "License plate is required")
    @Size(max = 30, message = "License plate must not exceed 30 characters")
    private String licensePlate;
}
