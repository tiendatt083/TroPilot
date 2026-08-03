package com.tropilot.mapper;

import com.tropilot.dto.response.RoomResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import org.springframework.stereotype.Component;

@Component
/**
 * Chuyển dữ liệu phòng sang RoomResponse để trả về API.
 * Response kèm thông tin tòa nhà chứa phòng vì đây là ngữ cảnh cần hiển thị thường xuyên.
 */
public class RoomMapper {

    /** Chuyển một Room thành RoomResponse. */
    public RoomResponse toResponse(Room room) {
        Building building = room.getBuilding();

        return RoomResponse.builder()
                .id(room.getId())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .buildingAddress(building.getAddress())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .floor(room.getFloor())
                .price(room.getPrice())
                .area(room.getArea())
                .maxOccupants(room.getMaxOccupants())
                .status(room.getStatus())
                .description(room.getDescription())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}
