package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class UtilityReadingResponse {

    private Long id;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private String month;
    private BigDecimal oldElectricity;
    private BigDecimal newElectricity;
    private BigDecimal electricityUsage;
    private String electricityImageUrl;
    private BigDecimal oldWater;
    private BigDecimal newWater;
    private BigDecimal waterUsage;
    private String waterImageUrl;
    private String editReason;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
