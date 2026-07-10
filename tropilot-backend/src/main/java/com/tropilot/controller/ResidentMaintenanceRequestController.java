package com.tropilot.controller;

import com.tropilot.dto.request.MaintenanceRequestCreateRequest;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resident/maintenance-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
public class ResidentMaintenanceRequestController {

    private final MaintenanceRequestService maintenanceRequestService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MaintenanceRequestResponse> createRequest(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @ModelAttribute MaintenanceRequestCreateRequest request
    ) {
        return ApiResponse.success(
                "Maintenance request created successfully",
                maintenanceRequestService.createResidentRequest(getUserId(user), request)
        );
    }

    @GetMapping
    public ApiResponse<List<MaintenanceRequestResponse>> getRequests(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Maintenance requests loaded successfully",
                maintenanceRequestService.getResidentRequests(getUserId(user))
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<MaintenanceRequestResponse> getRequest(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Maintenance request loaded successfully",
                maintenanceRequestService.getResidentRequest(getUserId(user), id)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
