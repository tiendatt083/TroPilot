package com.tropilot.controller;

import com.tropilot.dto.request.AssignHeadResidentRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.service.HeadResidentAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/rooms/{roomId}/head-resident")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHeadResidentAssignmentController {

    private final HeadResidentAssignmentService headResidentAssignmentService;

    @PostMapping
    public ApiResponse<HeadResidentAssignmentResponse> assignHeadResident(
            @PathVariable(name = "roomId") Long roomId,
            @Valid @RequestBody AssignHeadResidentRequest request
    ) {
        return ApiResponse.success(
                "Head Resident assigned successfully",
                headResidentAssignmentService.assignHeadResident(roomId, request)
        );
    }

    @GetMapping
    public ApiResponse<HeadResidentAssignmentResponse> getHeadResident(@PathVariable(name = "roomId") Long roomId) {
        return ApiResponse.success(
                "Head Resident assignment loaded successfully",
                headResidentAssignmentService.getHeadResidentAssignment(roomId)
        );
    }

    @DeleteMapping
    public ApiResponse<HeadResidentAssignmentResponse> removeHeadResident(@PathVariable(name = "roomId") Long roomId) {
        return ApiResponse.success(
                "Contract ended successfully",
                headResidentAssignmentService.removeHeadResident(roomId)
        );
    }
}
