package com.tropilot.dto.response;

import com.tropilot.enums.CalculationType;
import com.tropilot.enums.FeeType;
import com.tropilot.enums.VehicleType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
/** Một loại phí của tòa nhà: giá, cách tính, loại xe (nếu có) và trạng thái đang áp dụng. */
public class ServiceFeeResponse {

    private Long id;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private String name;
    private FeeType feeType;
    private BigDecimal unitPrice;
    private CalculationType calculationType;
    private VehicleType vehicleType;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
