package com.tropilot.service.impl;

import com.tropilot.dto.response.UtilityReadingResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import com.tropilot.entity.UtilityReading;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class UtilityReadingMapper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public UtilityReadingResponse toResponse(UtilityReading reading) {
        Room room = reading.getRoom();
        Building building = room.getBuilding();
        User createdBy = reading.getCreatedBy();

        return UtilityReadingResponse.builder()
                .id(reading.getId())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .month(reading.getMonth().format(MONTH_FORMATTER))
                .oldElectricity(reading.getOldElectricity())
                .newElectricity(reading.getNewElectricity())
                .electricityUsage(reading.getNewElectricity().subtract(reading.getOldElectricity()))
                .electricityImageUrl(reading.getElectricityImageUrl())
                .oldWater(reading.getOldWater())
                .newWater(reading.getNewWater())
                .waterUsage(reading.getNewWater().subtract(reading.getOldWater()))
                .waterImageUrl(reading.getWaterImageUrl())
                .editReason(reading.getEditReason())
                .createdById(createdBy.getId())
                .createdByName(createdBy.getFullName())
                .createdByRole(createdBy.getRole().name())
                .createdAt(reading.getCreatedAt())
                .updatedAt(reading.getUpdatedAt())
                .build();
    }
}
