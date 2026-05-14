package com.tropilot.dto.response;

import com.tropilot.enums.VehicleOwnerType;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.enums.VehicleType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class VehicleResponse {

    private Long id;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private String ownerName;
    private VehicleOwnerType ownerType;
    private VehicleType vehicleType;
    private String licensePlate;
    private String brand;
    private String color;
    private LocalDate startDate;
    private LocalDate endDate;
    private VehicleStatus status;
    private boolean billable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
