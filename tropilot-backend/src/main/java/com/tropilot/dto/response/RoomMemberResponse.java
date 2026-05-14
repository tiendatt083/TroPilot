package com.tropilot.dto.response;

import com.tropilot.enums.RoomMemberStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class RoomMemberResponse {

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
    private String fullName;
    private String phone;
    private String identityNumber;
    private LocalDate dateOfBirth;
    private String relationship;
    private LocalDate moveInDate;
    private LocalDate moveOutDate;
    private RoomMemberStatus status;
    private String note;
    private Integer headResidentOccupantCount;
    private Integer approvedMemberCount;
    private Integer totalOccupants;
    private Integer maxOccupants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
