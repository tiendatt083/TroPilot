package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/invoice-complaints")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminInvoiceComplaintController {

    private final FeedbackService feedbackService;

    @GetMapping
    public ApiResponse<List<FeedbackResponse>> getInvoiceComplaints() {
        return ApiResponse.success("Invoice complaints loaded successfully", feedbackService.getInvoiceComplaints());
    }
}
