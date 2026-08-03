package com.tropilot.dto.response;

import com.tropilot.enums.FeedbackStatus;
import com.tropilot.enums.FeedbackType;
import com.tropilot.enums.TaskStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
/** Phản ánh đầy đủ: người gửi, phòng/hóa đơn liên quan, phản hồi và công việc xử lý. */
public class FeedbackResponse {

    private Long id;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long invoiceId;
    private LocalDate invoiceMonth;
    private BigDecimal invoiceTotalAmount;
    private FeedbackType type;
    private String title;
    private String content;
    private FeedbackStatus status;
    private String reply;
    private Long repliedById;
    private String repliedByName;
    private String repliedByRole;
    private Long assignedTaskId;
    private TaskStatus assignedTaskStatus;
    private Long assignedStaffId;
    private String assignedStaffName;
    private LocalDateTime assignedTaskUpdatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
