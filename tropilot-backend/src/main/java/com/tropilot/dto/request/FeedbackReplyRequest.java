package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/** Nội dung phản hồi của ADMIN đối với một phản ánh. */
public class FeedbackReplyRequest {

    @NotBlank(message = "Reply content is required")
    @Size(max = 2000, message = "Reply content must not exceed 2000 characters")
    private String reply;
}
