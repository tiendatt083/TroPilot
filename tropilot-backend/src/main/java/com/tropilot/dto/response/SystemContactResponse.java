package com.tropilot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemContactResponse {

    private boolean configured;
    private String email;
    private String officeAddress;
    private String workingHours;
    private LocalTime workingStartTime;
    private LocalTime workingEndTime;
    private List<ContactPhoneResponse> phones;
    private LocalDateTime updatedAt;
}
