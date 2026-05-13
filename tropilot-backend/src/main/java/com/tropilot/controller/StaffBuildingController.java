package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.service.BuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/buildings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffBuildingController {

    private final BuildingService buildingService;

    @GetMapping
    public ApiResponse<List<BuildingResponse>> getBuildings(@RequestParam(required = false) String search) {
        return ApiResponse.success("Buildings loaded successfully", buildingService.getBuildings(search));
    }

    @GetMapping("/{id}")
    public ApiResponse<BuildingResponse> getBuilding(@PathVariable Long id) {
        return ApiResponse.success("Building loaded successfully", buildingService.getBuilding(id));
    }
}
