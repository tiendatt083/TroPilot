package com.tropilot.mapper;

import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.entity.Building;
import org.springframework.stereotype.Component;

@Component
/**
 * Chuyển thông tin tòa nhà từ entity sang DTO phản hồi.
 * DTO chỉ mang dữ liệu cần hiển thị, không đưa trực tiếp entity ra API.
 */
public class BuildingMapper {

    /** Chuyển một Building thành BuildingResponse để trả về client. */
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
