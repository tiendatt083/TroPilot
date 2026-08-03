package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
/** Một lần bảo trì thiết bị, gồm kết quả, ảnh và nhân viên đã thực hiện. */
public class EquipmentMaintenanceHistoryResponse {

    private Long id;
    private Long equipmentId;
    private Long maintenanceRequestId;
    private LocalDate maintenanceDate;
    private String resultNote;
    private String resultImageUrl;
    private Long performedById;
    private String performedByName;
    private LocalDateTime createdAt;
}
