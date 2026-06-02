package com.tropilot.service;

import com.tropilot.dto.response.BuildingUserResponse;

import java.util.List;

public interface BuildingUserService {

    List<BuildingUserResponse> getBuildingUsers(Long buildingId);
}
