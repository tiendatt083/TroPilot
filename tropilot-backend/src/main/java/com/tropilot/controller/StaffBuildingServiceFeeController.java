package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.service.ServiceFeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/buildings/{buildingId}/service-fees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffBuildingServiceFeeController {

    private final ServiceFeeService serviceFeeService;

    @GetMapping
    public ApiResponse<List<ServiceFeeResponse>> getServiceFees(@PathVariable(name = "buildingId") Long buildingId) {
        return ApiResponse.success(
                "Service fees loaded successfully",
                serviceFeeService.getBuildingServiceFees(buildingId)
        );
    }
}
