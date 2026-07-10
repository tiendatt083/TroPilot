package com.tropilot.controller;

import com.tropilot.dto.request.EquipmentUpsertRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.EquipmentDeleteResponse;
import com.tropilot.dto.response.EquipmentResponse;
import com.tropilot.service.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/buildings/{buildingId}/equipment")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBuildingEquipmentController {

    private final EquipmentService equipmentService;

    @PostMapping
    public ApiResponse<EquipmentResponse> createEquipment(
            @PathVariable(name = "buildingId") Long buildingId,
            @Valid @RequestBody EquipmentUpsertRequest request
    ) {
        return ApiResponse.success(
                "Equipment created successfully",
                equipmentService.createEquipment(buildingId, request)
        );
    }

    @GetMapping
    public ApiResponse<List<EquipmentResponse>> getEquipment(
            @PathVariable(name = "buildingId") Long buildingId,
            @RequestParam(name = "scope", required = false) String scope,
            @RequestParam(name = "roomId", required = false) Long roomId,
            @RequestParam(name = "condition", required = false) String condition
    ) {
        return ApiResponse.success(
                "Equipment loaded successfully",
                equipmentService.getAdminBuildingEquipment(buildingId, scope, roomId, condition)
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<EquipmentResponse> updateEquipment(
            @PathVariable(name = "buildingId") Long buildingId,
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody EquipmentUpsertRequest request
    ) {
        return ApiResponse.success(
                "Equipment updated successfully",
                equipmentService.updateEquipment(buildingId, id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ApiResponse<EquipmentDeleteResponse> deleteEquipment(
            @PathVariable(name = "buildingId") Long buildingId,
            @PathVariable(name = "id") Long id
    ) {
        EquipmentDeleteResponse response = equipmentService.deleteEquipment(buildingId, id);
        String message = response.isDeleted()
                ? "Equipment deleted successfully"
                : "Equipment has maintenance history and was deactivated instead";
        return ApiResponse.success(message, response);
    }
}
