package com.tropilot.controller;

import com.tropilot.dto.request.BuildingUpsertRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.service.BuildingService;
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
@RequestMapping("/api/admin/buildings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
/**
 * API chỉ cho ADMIN quản lý tòa nhà.
 * POST / tạo tòa nhà; GET / xem danh sách (có thể tìm kiếm); GET /{id} xem chi tiết;
 * PUT /{id} sửa thông tin; DELETE /{id} xóa tòa nhà khi dữ liệu cho phép.
 */
public class AdminBuildingController {

    private final BuildingService buildingService;

    @PostMapping
    public ApiResponse<BuildingResponse> createBuilding(@Valid @RequestBody BuildingUpsertRequest request) {
        return ApiResponse.success("Building created successfully", buildingService.createBuilding(request));
    }

    @GetMapping
    public ApiResponse<List<BuildingResponse>> getBuildings(@RequestParam(name = "search", required = false) String search) {
        return ApiResponse.success("Buildings loaded successfully", buildingService.getBuildings(search));
    }

    @GetMapping("/{id}")
    public ApiResponse<BuildingResponse> getBuilding(@PathVariable(name = "id") Long id) {
        return ApiResponse.success("Building loaded successfully", buildingService.getBuilding(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<BuildingResponse> updateBuilding(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody BuildingUpsertRequest request
    ) {
        return ApiResponse.success("Building updated successfully", buildingService.updateBuilding(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteBuilding(@PathVariable(name = "id") Long id) {
        buildingService.deleteBuilding(id);
        return ApiResponse.success("Building deleted successfully");
    }
}
