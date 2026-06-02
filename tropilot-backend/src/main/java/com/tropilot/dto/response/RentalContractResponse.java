package com.tropilot.dto.response;

import com.tropilot.enums.ContractStatus;
import com.tropilot.enums.RentalStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class RentalContractResponse {

    private Long id;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal depositAmount;
    private RentalStatus rentalStatus;
    private String contractFileUrl;
    private ContractStatus contractStatus;
    private List<ContractFileHistoryResponse> previousContractFiles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
