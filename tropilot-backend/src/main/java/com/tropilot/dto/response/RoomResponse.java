package com.tropilot.dto.response;

import com.tropilot.enums.RoomStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
/** Thông tin phòng: tòa nhà, giá, diện tích, sức chứa và trạng thái khai thác. */
public class RoomResponse {

    private Long id;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private String buildingAddress;
    private String roomCode;
    private String roomName;
    private Integer floor;
    private BigDecimal price;
    private BigDecimal area;
    private Integer maxOccupants;
    private RoomStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
