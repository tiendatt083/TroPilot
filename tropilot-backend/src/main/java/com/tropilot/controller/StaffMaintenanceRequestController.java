package com.tropilot.controller;

import com.tropilot.dto.request.MaintenanceCompleteRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.MaintenanceRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/maintenance-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffMaintenanceRequestController {

    private final MaintenanceRequestService maintenanceRequestService;

    @GetMapping
    public ApiResponse<List<MaintenanceRequestResponse>> getRequests(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success(
                "Maintenance requests loaded successfully",
                maintenanceRequestService.getStaffRequests(requireUserId(user), buildingId)
        );
    }

    @PutMapping("/{id}/start")
    public ApiResponse<MaintenanceRequestResponse> startRequest(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Maintenance request started successfully",
                maintenanceRequestService.startRequest(requireUserId(user), id)
        );
    }

    @PutMapping(path = "/{id}/complete", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MaintenanceRequestResponse> completeRequest(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @Valid @ModelAttribute MaintenanceCompleteRequest request
    ) {
        return ApiResponse.success(
                "Maintenance request completed successfully",
                maintenanceRequestService.completeRequest(requireUserId(user), id, request)
        );
    }
}
