package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/** Trạng thái mới mà ADMIN gán cho phản ánh, ví dụ đang xử lý hoặc đã hoàn tất. */
public class FeedbackStatusUpdateRequest {

    @NotBlank(message = "Feedback status is required")
    @Size(max = 30, message = "Feedback status must not exceed 30 characters")
    private String status;
}
