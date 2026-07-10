package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.EquipmentResponse;
import com.tropilot.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/buildings/{buildingId}/equipment")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffBuildingEquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    public ApiResponse<List<EquipmentResponse>> getEquipment(
            @PathVariable(name = "buildingId") Long buildingId,
            @RequestParam(name = "scope", required = false) String scope,
            @RequestParam(name = "roomId", required = false) Long roomId,
            @RequestParam(name = "condition", required = false) String condition
    ) {
        return ApiResponse.success(
                "Equipment loaded successfully",
                equipmentService.getStaffBuildingEquipment(buildingId, scope, roomId, condition)
        );
    }
}
