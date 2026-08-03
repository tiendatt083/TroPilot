package com.tropilot.service;

import com.tropilot.dto.response.BuildingUserResponse;

import java.util.List;

/** Hợp đồng lấy danh sách cư dân/chủ hộ thuộc một tòa nhà để quản lý. */
public interface BuildingUserService {

    List<BuildingUserResponse> getBuildingUsers(Long buildingId);
}
