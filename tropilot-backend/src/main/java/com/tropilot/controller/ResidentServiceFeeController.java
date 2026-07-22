package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.exception.BadRequestException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.HeadResidentAssignmentService;
import com.tropilot.service.ServiceFeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;

@RestController
@RequestMapping("/api/resident/service-fees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
public class ResidentServiceFeeController {

    private final HeadResidentAssignmentService headResidentAssignmentService;
    private final ServiceFeeService serviceFeeService;

    @GetMapping("/current-building")
    public ApiResponse<List<ServiceFeeResponse>> getCurrentBuildingServiceFees(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        HeadResidentAssignmentResponse assignment =
                headResidentAssignmentService.getResidentAssignedRoom(requireUserId(user));

        if (assignment == null || !assignment.isAssigned() || assignment.getBuildingId() == null) {
            throw new BadRequestException("Assigned room is required");
        }

        return ApiResponse.success(
                "Current building service fees loaded successfully",
                serviceFeeService.getActiveBuildingServiceFees(assignment.getBuildingId())
        );
    }
}
