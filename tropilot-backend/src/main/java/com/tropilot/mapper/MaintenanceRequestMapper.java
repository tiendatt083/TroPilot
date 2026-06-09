package com.tropilot.mapper;

import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.MaintenanceRequest;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
public class MaintenanceRequestMapper {

    public MaintenanceRequestResponse toResponse(MaintenanceRequest request) {
        Room room = request.getRoom();
        Building building = room.getBuilding();
        User residentHead = request.getResidentHead();
        User assignedTo = request.getAssignedTo();

        return MaintenanceRequestResponse.builder()
                .id(request.getId())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .title(request.getTitle())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .assignedToId(assignedTo == null ? null : assignedTo.getId())
                .assignedToName(assignedTo == null ? null : assignedTo.getFullName())
                .assignedToEmail(assignedTo == null ? null : assignedTo.getEmail())
                .status(request.getStatus())
                .resultNote(request.getResultNote())
                .resultImageUrl(request.getResultImageUrl())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
