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
/** Thông tin liên hệ chung để hiển thị, kèm configured cho biết hệ thống đã cấu hình hay chưa. */
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
