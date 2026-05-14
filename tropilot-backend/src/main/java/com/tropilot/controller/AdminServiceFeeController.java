package com.tropilot.controller;

import com.tropilot.dto.request.ServiceFeeRequest;
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
@RequestMapping("/api/admin/service-fees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminServiceFeeController {

    private final ServiceFeeService serviceFeeService;

    @PostMapping
    public ApiResponse<ServiceFeeResponse> createServiceFee(@Valid @RequestBody ServiceFeeRequest request) {
        return ApiResponse.success("Service fee created successfully", serviceFeeService.createServiceFee(request));
    }

    @GetMapping
    public ApiResponse<List<ServiceFeeResponse>> getServiceFees() {
        return ApiResponse.success("Service fees loaded successfully", serviceFeeService.getServiceFees());
    }

    @GetMapping("/{id}")
    public ApiResponse<ServiceFeeResponse> getServiceFee(@PathVariable Long id) {
        return ApiResponse.success("Service fee loaded successfully", serviceFeeService.getServiceFee(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<ServiceFeeResponse> updateServiceFee(
            @PathVariable Long id,
            @Valid @RequestBody ServiceFeeRequest request
    ) {
        return ApiResponse.success("Service fee updated successfully", serviceFeeService.updateServiceFee(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<ServiceFeeDeleteResponse> deleteServiceFee(@PathVariable Long id) {
        ServiceFeeDeleteResponse response = serviceFeeService.deleteServiceFee(id);
        String message = response.isDeleted()
                ? "Service fee deleted successfully"
                : "Service fee is used by invoice items and was deactivated instead";

        return ApiResponse.success(message, response);
    }

    @PutMapping("/{id}/toggle")
    public ApiResponse<ServiceFeeResponse> toggleServiceFee(@PathVariable Long id) {
        return ApiResponse.success("Service fee status updated successfully", serviceFeeService.toggleServiceFee(id));
    }
}
