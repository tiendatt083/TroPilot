package com.tropilot.service.impl;

import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.entity.Vehicle;
import com.tropilot.enums.VehicleStatus;
import org.springframework.stereotype.Component;

@Component
public class VehicleMapper {

    public VehicleResponse toResponse(Vehicle vehicle) {
        Room room = vehicle.getRoom();
        Building building = room.getBuilding();

        return VehicleResponse.builder()
                .id(vehicle.getId())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .ownerName(vehicle.getOwnerName())
                .ownerType(vehicle.getOwnerType())
                .vehicleType(vehicle.getVehicleType())
                .licensePlate(vehicle.getLicensePlate())
                .brand(vehicle.getBrand())
                .color(vehicle.getColor())
                .startDate(vehicle.getStartDate())
                .endDate(vehicle.getEndDate())
                .status(vehicle.getStatus())
                .billable(vehicle.getStatus() == VehicleStatus.ACTIVE)
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt())
                .build();
    }
}
