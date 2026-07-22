package com.tropilot.controller;

import com.tropilot.dto.request.AdminVehicleCreateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/vehicles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminVehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ApiResponse<List<VehicleResponse>> getVehicles(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Vehicles loaded successfully", vehicleService.getVehicles(buildingId));
    }

    @PostMapping
    public ApiResponse<VehicleResponse> createVehicle(
            @Valid @RequestBody AdminVehicleCreateRequest request,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success("Vehicle created successfully", vehicleService.createAdminVehicle(request, buildingId));
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<VehicleResponse> approveVehicle(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success("Vehicle approved successfully", vehicleService.approveVehicle(id, buildingId));
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<VehicleResponse> rejectVehicle(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success("Vehicle rejected successfully", vehicleService.rejectVehicle(id, requireUserId(user), buildingId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteVehicle(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        vehicleService.deleteVehicle(id, buildingId);
        return ApiResponse.success("Vehicle deleted successfully");
    }
}
