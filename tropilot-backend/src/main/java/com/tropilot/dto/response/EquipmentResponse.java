package com.tropilot.dto.response;

import com.tropilot.enums.EquipmentCondition;
import com.tropilot.enums.EquipmentScope;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
/** Thông tin thiết bị cùng vị trí, phạm vi dùng, tình trạng và lịch bảo trì. */
public class EquipmentResponse {

    private Long id;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private String equipmentCode;
    private String name;
    private EquipmentScope scope;
    private Integer quantity;
    private String brand;
    private String model;
    private String locationDescription;
    private LocalDate addedDate;
    private LocalDate installationDate;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private EquipmentCondition condition;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
