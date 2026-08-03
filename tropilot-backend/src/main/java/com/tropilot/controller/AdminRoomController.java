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
/**
 * API quản lý phòng.
 * POST / tạo phòng; GET / xem/lọc danh sách; GET /{id} xem chi tiết;
 * PUT /{id} cập nhật; DELETE /{id} xóa nếu phòng không bị ràng buộc bởi dữ liệu khác.
 */
public class AdminRoomController {

    private final RoomService roomService;

    @PostMapping
    public ApiResponse<RoomResponse> createRoom(@Valid @RequestBody RoomUpsertRequest request) {
        return ApiResponse.success("Room created successfully", roomService.createRoom(request));
    }

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

    @PutMapping("/{id}")
    public ApiResponse<RoomResponse> updateRoom(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody RoomUpsertRequest request
    ) {
        return ApiResponse.success("Room updated successfully", roomService.updateRoom(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRoom(@PathVariable(name = "id") Long id) {
        roomService.deleteRoom(id);
        return ApiResponse.success("Room deleted successfully");
    }
}
