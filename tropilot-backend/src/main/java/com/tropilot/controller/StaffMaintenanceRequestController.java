package com.tropilot.controller;

import com.tropilot.dto.request.MaintenanceCompleteRequest;
import com.tropilot.dto.request.MaintenanceRejectRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
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
import org.springframework.web.bind.annotation.RequestBody;
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
                maintenanceRequestService.getStaffRequests(getUserId(user), buildingId)
        );
    }

    @PutMapping("/{id}/start")
    public ApiResponse<MaintenanceRequestResponse> startRequest(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Maintenance request started successfully",
                maintenanceRequestService.startRequest(getUserId(user), id)
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
                maintenanceRequestService.completeRequest(getUserId(user), id, request)
        );
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<MaintenanceRequestResponse> rejectRequest(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody(required = false) MaintenanceRejectRequest request
    ) {
        return ApiResponse.success(
                "Maintenance request rejected successfully",
                maintenanceRequestService.rejectRequest(getUserId(user), id, request)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
