package com.tropilot.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tropilot.enums.ContractStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HeadResidentAssignmentResponse {

    private boolean assigned;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private RoomStatus roomStatus;
    private BigDecimal roomPrice;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private String residentHeadPhone;
    private Long assignmentId;
    private LocalDate assignmentStartDate;
    private LocalDate assignmentEndDate;
    private RoomAssignmentStatus assignmentStatus;
    private Long contractId;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private BigDecimal depositAmount;
    private RentalStatus rentalStatus;
    private String contractFileUrl;
    private ContractStatus contractStatus;
}
