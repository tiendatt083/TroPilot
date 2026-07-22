package com.tropilot.controller;

import com.tropilot.dto.request.FeedbackCreateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resident/feedbacks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
public class ResidentFeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    public ApiResponse<List<FeedbackResponse>> getFeedbacks(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success("Feedbacks loaded successfully", feedbackService.getResidentFeedbacks(requireUserId(user)));
    }

    @PostMapping
    public ApiResponse<FeedbackResponse> createFeedback(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody FeedbackCreateRequest request
    ) {
        return ApiResponse.success("Feedback submitted successfully", feedbackService.createResidentFeedback(requireUserId(user), request));
    }
}
