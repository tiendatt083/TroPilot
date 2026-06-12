package com.tropilot.mapper;

import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.ServiceFee;
import org.springframework.stereotype.Component;

@Component
public class ServiceFeeMapper {

    public ServiceFeeResponse toResponse(ServiceFee serviceFee) {
        Building building = serviceFee.getBuilding();

        return ServiceFeeResponse.builder()
                .id(serviceFee.getId())
                .buildingId(building == null ? null : building.getId())
                .buildingCode(building == null ? null : building.getBuildingCode())
                .buildingName(building == null ? null : building.getName())
                .name(serviceFee.getName())
                .feeType(serviceFee.getFeeType())
                .unitPrice(serviceFee.getUnitPrice())
                .calculationType(serviceFee.getCalculationType())
                .vehicleType(serviceFee.getVehicleType())
                .isActive(serviceFee.getIsActive())
                .createdAt(serviceFee.getCreatedAt())
                .updatedAt(serviceFee.getUpdatedAt())
                .build();
    }
}
