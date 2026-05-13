package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BuildingResponse {

    private Long id;
    private String buildingCode;
    private String name;
    private String address;
    private Integer floors;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
