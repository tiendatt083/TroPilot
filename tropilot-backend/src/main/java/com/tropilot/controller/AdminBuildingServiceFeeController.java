package com.tropilot.controller;

import com.tropilot.dto.request.ServiceFeeUpsertRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ServiceFeeDeleteResponse;
import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.service.ServiceFeeService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/buildings/{buildingId}/service-fees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBuildingServiceFeeController {

    private final ServiceFeeService serviceFeeService;

    @PostMapping
    public ApiResponse<ServiceFeeResponse> createServiceFee(
            @PathVariable(name = "buildingId") Long buildingId,
            @Valid @RequestBody ServiceFeeUpsertRequest request
    ) {
        return ApiResponse.success(
                "Service fee created successfully",
                serviceFeeService.createBuildingServiceFee(buildingId, request)
        );
    }

    @GetMapping
    public ApiResponse<List<ServiceFeeResponse>> getServiceFees(@PathVariable(name = "buildingId") Long buildingId) {
        return ApiResponse.success(
                "Service fees loaded successfully",
                serviceFeeService.getBuildingServiceFees(buildingId)
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<ServiceFeeResponse> updateServiceFee(
            @PathVariable(name = "buildingId") Long buildingId,
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody ServiceFeeUpsertRequest request
    ) {
        return ApiResponse.success(
                "Service fee updated successfully",
                serviceFeeService.updateBuildingServiceFee(buildingId, id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ApiResponse<ServiceFeeDeleteResponse> deleteServiceFee(
            @PathVariable(name = "buildingId") Long buildingId,
            @PathVariable(name = "id") Long id
    ) {
        ServiceFeeDeleteResponse response = serviceFeeService.deleteBuildingServiceFee(buildingId, id);
        String message = response.isDeleted()
                ? "Service fee deleted successfully"
                : "Service fee is used by invoice items and was deactivated instead";

        return ApiResponse.success(message, response);
    }

    @PutMapping("/{id}/toggle")
    public ApiResponse<ServiceFeeResponse> toggleServiceFee(
            @PathVariable(name = "buildingId") Long buildingId,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Service fee status updated successfully",
                serviceFeeService.toggleBuildingServiceFee(buildingId, id)
        );
    }
}
