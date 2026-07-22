package com.tropilot.controller;

import com.tropilot.dto.request.VehicleRegistrationRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resident/vehicles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
public class ResidentVehicleController {

    private final VehicleService vehicleService;

    @PostMapping("/request")
    public ApiResponse<VehicleResponse> requestVehicle(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody VehicleRegistrationRequest request
    ) {
        return ApiResponse.success(
                "Vehicle registration requested successfully",
                vehicleService.requestVehicle(requireUserId(user), request)
        );
    }

    @GetMapping
    public ApiResponse<List<VehicleResponse>> getVehicles(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Vehicles loaded successfully",
                vehicleService.getResidentVehicles(requireUserId(user))
        );
    }

    @PutMapping("/{id}/request-cancel")
    public ApiResponse<VehicleResponse> requestCancel(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Vehicle cancellation requested successfully",
                vehicleService.requestCancel(requireUserId(user), id)
        );
    }
}
