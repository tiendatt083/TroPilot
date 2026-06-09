package com.tropilot.controller;

import com.tropilot.dto.request.RoomUpsertRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RoomResponse;
import com.tropilot.service.RoomService;
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
@RequestMapping("/api/admin/rooms")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoomController {

    private final RoomService roomService;

    @PostMapping
    public ApiResponse<RoomResponse> createRoom(@Valid @RequestBody RoomUpsertRequest request) {
        return ApiResponse.success("Room created successfully", roomService.createRoom(request));
    }

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

    @PutMapping("/{id}")
    public ApiResponse<RoomResponse> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomUpsertRequest request
    ) {
        return ApiResponse.success("Room updated successfully", roomService.updateRoom(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ApiResponse.success("Room deleted successfully");
    }
}
