package com.tropilot.mapper;

import com.tropilot.dto.response.UtilityReadingResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import com.tropilot.entity.UtilityReading;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class UtilityReadingMapper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public UtilityReadingResponse toResponse(UtilityReading reading) {
        return toResponse(reading, null);
    }

    public UtilityReadingResponse toResponse(UtilityReading reading, UtilityReading previousReading) {
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
                .readingDate(formatReadingDate(reading))
                .oldElectricity(reading.getOldElectricity())
                .newElectricity(reading.getNewElectricity())
                .electricityUsage(reading.getNewElectricity().subtract(reading.getOldElectricity()))
                .electricityImageUrl(reading.getElectricityImageUrl())
                .oldWater(reading.getOldWater())
                .newWater(reading.getNewWater())
                .waterUsage(reading.getNewWater().subtract(reading.getOldWater()))
                .waterImageUrl(reading.getWaterImageUrl())
                .previousReadingMonth(formatPreviousReadingMonth(previousReading))
                .previousReadingDate(formatPreviousReadingDate(previousReading))
                .previousElectricityImageUrl(previousReading == null ? null : previousReading.getElectricityImageUrl())
                .previousWaterImageUrl(previousReading == null ? null : previousReading.getWaterImageUrl())
                .editReason(reading.getEditReason())
                .createdById(createdBy.getId())
                .createdByName(createdBy.getFullName())
                .createdByRole(createdBy.getRole().name())
                .createdAt(reading.getCreatedAt())
                .updatedAt(reading.getUpdatedAt())
                .build();
    }

    private String formatReadingDate(UtilityReading reading) {
        LocalDate readingDate = reading.getReadingDate() == null ? reading.getMonth() : reading.getReadingDate();
        return readingDate == null ? null : readingDate.toString();
    }

    private String formatPreviousReadingMonth(UtilityReading previousReading) {
        return previousReading == null ? null : previousReading.getMonth().format(MONTH_FORMATTER);
    }

    private String formatPreviousReadingDate(UtilityReading previousReading) {
        return previousReading == null ? null : formatReadingDate(previousReading);
    }
}
