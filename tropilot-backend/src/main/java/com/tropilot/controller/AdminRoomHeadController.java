package com.tropilot.controller;

import com.tropilot.dto.request.AssignHeadResidentRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RoomHeadResponse;
import com.tropilot.service.HeadResidentAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/rooms/{roomId}")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoomHeadController {

    private final HeadResidentAssignmentService headResidentAssignmentService;

    @PostMapping("/assign-head")
    public ApiResponse<RoomHeadResponse> assignHeadResident(
            @PathVariable Long roomId,
            @Valid @RequestBody AssignHeadResidentRequest request
    ) {
        return ApiResponse.success(
                "Head Resident assigned successfully",
                headResidentAssignmentService.assignHeadResident(roomId, request)
        );
    }

    @GetMapping("/head")
    public ApiResponse<RoomHeadResponse> getHeadResident(@PathVariable Long roomId) {
        return ApiResponse.success(
                "Head Resident assignment loaded successfully",
                headResidentAssignmentService.getRoomHead(roomId)
        );
    }

    @PutMapping("/remove-head")
    public ApiResponse<RoomHeadResponse> removeHeadResident(@PathVariable Long roomId) {
        return ApiResponse.success(
                "Head Resident removed successfully",
                headResidentAssignmentService.removeHeadResident(roomId)
        );
    }
}
