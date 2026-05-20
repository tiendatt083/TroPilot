package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.service.VehicleService;
import lombok.RequiredArgsConstructor;
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
    public ApiResponse<List<VehicleResponse>> getVehicles(@RequestParam(required = false) Long buildingId) {
        return ApiResponse.success("Vehicles loaded successfully", vehicleService.getVehicles(buildingId));
    }

    @GetMapping("/pending")
    public ApiResponse<List<VehicleResponse>> getPendingVehicles(@RequestParam(required = false) Long buildingId) {
        return ApiResponse.success("Pending vehicles loaded successfully", vehicleService.getPendingVehicles(buildingId));
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<VehicleResponse> approveVehicle(
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success("Vehicle approved successfully", vehicleService.approveVehicle(id, buildingId));
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<VehicleResponse> rejectVehicle(
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success("Vehicle rejected successfully", vehicleService.rejectVehicle(id, buildingId));
    }

    @PutMapping("/{id}/deactivate")
    public ApiResponse<VehicleResponse> deactivateVehicle(
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success("Vehicle deactivated successfully", vehicleService.deactivateVehicle(id, buildingId));
    }
}
