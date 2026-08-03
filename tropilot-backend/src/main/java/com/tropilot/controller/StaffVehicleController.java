package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/vehicles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
/**
 * API chỉ đọc đăng ký phương tiện cho STAFF.
 * GET / trả về phương tiện và có thể lọc theo buildingId để phục vụ kiểm tra bãi xe.
 */
public class StaffVehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ApiResponse<List<VehicleResponse>> getVehicles(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Vehicles loaded successfully", vehicleService.getVehicles(buildingId));
    }
}
