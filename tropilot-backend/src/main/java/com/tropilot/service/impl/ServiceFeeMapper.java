package com.tropilot.service.impl;

import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.entity.ServiceFee;
import org.springframework.stereotype.Component;

@Component
public class ServiceFeeMapper {

    public ServiceFeeResponse toResponse(ServiceFee serviceFee) {
        return ServiceFeeResponse.builder()
                .id(serviceFee.getId())
                .name(serviceFee.getName())
                .feeCode(serviceFee.getFeeCode())
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
