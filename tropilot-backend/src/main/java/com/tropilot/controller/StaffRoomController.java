package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RoomResponse;
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
public class StaffRoomController {

    private final RoomService roomService;

    @GetMapping
    public ApiResponse<List<RoomResponse>> getRooms(
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        return ApiResponse.success("Rooms loaded successfully", roomService.getRooms(buildingId, status, search));
    }

    @GetMapping("/{id}")
    public ApiResponse<RoomResponse> getRoom(@PathVariable Long id) {
        return ApiResponse.success("Room loaded successfully", roomService.getRoom(id));
    }
}
