package com.tropilot.dto.response;

import com.tropilot.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
/** Bản ghi lịch sử hoạt động: ai làm gì, mô tả, vai trò và thời điểm thực hiện. */
public class ActivityLogResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private UserRole userRole;
    private String action;
    private String description;
    private LocalDateTime createdAt;
}
