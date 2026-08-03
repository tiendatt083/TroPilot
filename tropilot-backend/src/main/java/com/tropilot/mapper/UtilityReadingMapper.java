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
/**
 * Chuyển chỉ số điện nước của phòng thành dữ liệu phản hồi cho API.
 * Mapper tính luôn lượng điện, nước đã dùng và có thể kèm chỉ số kỳ trước để người dùng đối chiếu ảnh chụp.
 */
public class UtilityReadingMapper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    /** Chuyển chỉ số điện nước khi không cần kèm dữ liệu kỳ trước. */
    public UtilityReadingResponse toResponse(UtilityReading reading) {
        return toResponse(reading, null);
    }

    /**
     * Chuyển chỉ số điện nước kèm chỉ số kỳ trước, phục vụ việc so sánh và kiểm tra ảnh chụp đồng hồ.
     */
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

    /**
     * Lấy ngày ghi chỉ số; dùng tháng ghi chỉ số nếu bản ghi chưa có ngày đọc cụ thể.
     */
    private String formatReadingDate(UtilityReading reading) {
        LocalDate readingDate = reading.getReadingDate() == null ? reading.getMonth() : reading.getReadingDate();
        return readingDate == null ? null : readingDate.toString();
    }

    /** Định dạng tháng của kỳ trước theo yyyy-MM, hoặc trả về null nếu không có kỳ trước. */
    private String formatPreviousReadingMonth(UtilityReading previousReading) {
        return previousReading == null ? null : previousReading.getMonth().format(MONTH_FORMATTER);
    }

    /** Lấy ngày đọc của kỳ trước theo cùng quy tắc với kỳ hiện tại. */
    private String formatPreviousReadingDate(UtilityReading previousReading) {
        return previousReading == null ? null : formatReadingDate(previousReading);
    }
}
