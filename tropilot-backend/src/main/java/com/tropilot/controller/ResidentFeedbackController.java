package com.tropilot.controller;

import com.tropilot.dto.request.FeedbackCreateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resident/feedbacks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
public class ResidentFeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ApiResponse<FeedbackResponse> createFeedback(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody FeedbackCreateRequest request
    ) {
        return ApiResponse.success("Feedback submitted successfully", feedbackService.createResidentFeedback(getUserId(user), request));
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
