package com.tropilot.service;

import com.tropilot.dto.request.BuildingRequest;
import com.tropilot.dto.response.BuildingResponse;

import java.util.List;

public interface BuildingService {

    BuildingResponse createBuilding(BuildingRequest request);

    List<BuildingResponse> getBuildings(String search);

    BuildingResponse getBuilding(Long id);

    BuildingResponse updateBuilding(Long id, BuildingRequest request);

    void deleteBuilding(Long id);
}
