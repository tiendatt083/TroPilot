package com.tropilot.controller;

import com.tropilot.dto.request.MaintenanceRequestCreateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.EquipmentMaintenanceHistoryResponse;
import com.tropilot.dto.response.EquipmentResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.EquipmentService;
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
@RequestMapping("/api/staff/equipment")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffEquipmentController {

    private final EquipmentService equipmentService;
    private final MaintenanceRequestService maintenanceRequestService;

    @GetMapping("/{id}")
    public ApiResponse<EquipmentResponse> getEquipment(@PathVariable(name = "id") Long id) {
        return ApiResponse.success("Equipment loaded successfully", equipmentService.getEquipment(id));
    }

    @GetMapping("/{id}/maintenance-history")
    public ApiResponse<List<EquipmentMaintenanceHistoryResponse>> getMaintenanceHistory(@PathVariable(name = "id") Long id) {
        return ApiResponse.success(
                "Equipment maintenance history loaded successfully",
                equipmentService.getMaintenanceHistory(id)
        );
    }

    @PostMapping(path = "/{id}/maintenance-requests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MaintenanceRequestResponse> requestMaintenance(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @Valid @ModelAttribute MaintenanceRequestCreateRequest request
    ) {
        return ApiResponse.success(
                "Equipment maintenance request created successfully",
                maintenanceRequestService.createEquipmentRequest(getUserId(user), id, request)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }
        return user.getId();
    }
}
