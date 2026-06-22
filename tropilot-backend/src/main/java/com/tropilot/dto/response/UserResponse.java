package com.tropilot.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private UserRole role;
    private UserStatus status;
    private boolean mustChangePassword;
    private String temporaryPassword;
    private Long assignedRoomId;
    private String assignedRoomCode;
    private String assignedRoomName;
    private Long assignedBuildingId;
    private String assignedBuildingCode;
    private String assignedBuildingName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
