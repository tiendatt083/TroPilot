package com.tropilot.controller;

import com.tropilot.dto.request.MaintenanceAssignRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.service.MaintenanceRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/maintenance-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMaintenanceRequestController {

    private final MaintenanceRequestService maintenanceRequestService;

    @GetMapping
    public ApiResponse<List<MaintenanceRequestResponse>> getRequests(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success(
                "Maintenance requests loaded successfully",
                maintenanceRequestService.getRequests(buildingId)
        );
    }

    @PutMapping("/{id}/assign")
    public ApiResponse<MaintenanceRequestResponse> assignRequest(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody MaintenanceAssignRequest request,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success(
                "Maintenance request assigned successfully",
                maintenanceRequestService.assignRequest(id, request, buildingId)
        );
    }
}
