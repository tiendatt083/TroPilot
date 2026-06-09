package com.tropilot.mapper;

import com.tropilot.dto.response.RoomResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import org.springframework.stereotype.Component;

@Component
public class RoomMapper {

    public RoomResponse toResponse(Room room) {
        Building building = room.getBuilding();

        return RoomResponse.builder()
                .id(room.getId())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
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
