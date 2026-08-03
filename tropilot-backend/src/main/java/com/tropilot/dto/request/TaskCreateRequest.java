package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
/** Dữ liệu ADMIN tạo nhiệm vụ mới: nội dung, người nhận, hạn chót, độ ưu tiên và liên kết liên quan. */
public class TaskCreateRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 160, message = "Task title must not exceed 160 characters")
    private String title;

    @NotBlank(message = "Task content is required")
    @Size(max = 2000, message = "Task content must not exceed 2000 characters")
    private String content;

    @NotBlank(message = "Task type is required")
    @Size(max = 40, message = "Task type must not exceed 40 characters")
    private String taskType;

    private Long feedbackId;

    private Long roomId;

    @NotNull(message = "Assigned staff is required")
    private Long assignedToId;

    @NotNull(message = "Task deadline is required")
    private LocalDateTime deadline;

    @NotBlank(message = "Task priority is required")
    @Size(max = 30, message = "Task priority must not exceed 30 characters")
    private String priority;
}
