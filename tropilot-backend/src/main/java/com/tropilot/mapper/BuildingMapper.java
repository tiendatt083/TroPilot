package com.tropilot.mapper;

import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.entity.Building;
import org.springframework.stereotype.Component;

@Component
public class BuildingMapper {

    public BuildingResponse toResponse(Building building) {
        return BuildingResponse.builder()
                .id(building.getId())
                .buildingCode(building.getBuildingCode())
                .name(building.getName())
                .address(building.getAddress())
                .floors(building.getFloors())
                .description(building.getDescription())
                .createdAt(building.getCreatedAt())
                .updatedAt(building.getUpdatedAt())
                .build();
    }
}
