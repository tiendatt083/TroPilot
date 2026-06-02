package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class BuildingUserResponse {

    private Long id;
    private String recordType;
    private String fullName;
    private String email;
    private String phone;
    private String identityNumber;
    private String role;
    private String status;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private String relationship;
    private LocalDate moveInDate;
    private LocalDate moveOutDate;
}
