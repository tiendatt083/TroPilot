package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.dto.response.RoomResponse;
import com.tropilot.service.HeadResidentAssignmentService;
import com.tropilot.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/rooms")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
/**
 * API chỉ đọc phòng dành cho STAFF.
 * GET / xem/lọc phòng; GET /{id} xem chi tiết; GET /{id}/head-resident xem người
 * chịu trách nhiệm chính của phòng để liên hệ khi xử lý việc.
 */
public class StaffRoomController {

    private final RoomService roomService;
    private final HeadResidentAssignmentService headResidentAssignmentService;

    @GetMapping
    public ApiResponse<List<RoomResponse>> getRooms(
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "search", required = false) String search
    ) {
        return ApiResponse.success("Rooms loaded successfully", roomService.getRooms(buildingId, status, search));
    }

    @GetMapping("/{id}")
    public ApiResponse<RoomResponse> getRoom(@PathVariable(name = "id") Long id) {
        return ApiResponse.success("Room loaded successfully", roomService.getRoom(id));
    }

    @GetMapping("/{id}/head-resident")
    public ApiResponse<HeadResidentAssignmentResponse> getHeadResident(@PathVariable(name = "id") Long id) {
        return ApiResponse.success(
                "Head Resident assignment loaded successfully",
                headResidentAssignmentService.getHeadResidentAssignment(id)
        );
    }
}
