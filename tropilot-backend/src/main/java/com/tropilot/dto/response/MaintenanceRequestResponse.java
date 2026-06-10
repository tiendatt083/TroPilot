package com.tropilot.dto.response;

import com.tropilot.enums.MaintenanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MaintenanceRequestResponse {

    private Long id;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private Long requestedById;
    private String requestedByName;
    private String requestedByEmail;
    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
    private String title;
    private String content;
    private String imageUrl;
    private Long assignedToId;
    private String assignedToName;
    private String assignedToEmail;
    private MaintenanceStatus status;
    private String resultNote;
    private String resultImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
