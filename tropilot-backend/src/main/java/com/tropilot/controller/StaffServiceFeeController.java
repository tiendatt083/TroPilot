package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.service.ServiceFeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/service-fees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffServiceFeeController {

    private final ServiceFeeService serviceFeeService;

    @GetMapping
    public ApiResponse<List<ServiceFeeResponse>> getServiceFees() {
        return ApiResponse.success("Service fees loaded successfully", serviceFeeService.getServiceFees());
    }
}
