package com.tropilot.controller;

import com.tropilot.dto.request.FeedbackReplyRequest;
import com.tropilot.dto.request.FeedbackStatusUpdateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/feedbacks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    public ApiResponse<List<FeedbackResponse>> getFeedbacks(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Feedbacks loaded successfully", feedbackService.getFeedbacks(buildingId));
    }

    @PutMapping("/{id}/reply")
    public ApiResponse<FeedbackResponse> replyFeedback(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @Valid @RequestBody FeedbackReplyRequest request
    ) {
        return ApiResponse.success("Feedback replied successfully", feedbackService.replyFeedback(id, requireUserId(user), request, buildingId));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<FeedbackResponse> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @Valid @RequestBody FeedbackStatusUpdateRequest request
    ) {
        return ApiResponse.success(
                "Feedback status updated successfully",
                feedbackService.updateFeedbackStatus(id, requireUserId(user), request, buildingId)
        );
    }
}
