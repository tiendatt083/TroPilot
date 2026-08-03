package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.BuildingUserResponse;
import com.tropilot.service.BuildingUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/buildings/{buildingId}/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
/**
 * API chỉ đọc danh sách người dùng của một tòa nhà.
 * GET / dùng buildingId trên URL để trả về cư dân, nhân viên hoặc các tài khoản
 * đang được liên kết với tòa nhà đó.
 */
public class AdminBuildingUserController {

    private final BuildingUserService buildingUserService;

    @GetMapping
    public ApiResponse<List<BuildingUserResponse>> getBuildingUsers(@PathVariable(name = "buildingId") Long buildingId) {
        return ApiResponse.success("Building users loaded successfully", buildingUserService.getBuildingUsers(buildingId));
    }
}
