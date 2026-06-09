package com.tropilot.service;

import com.tropilot.dto.request.BuildingUpsertRequest;
import com.tropilot.dto.response.BuildingResponse;

import java.util.List;

public interface BuildingService {

    BuildingResponse createBuilding(BuildingUpsertRequest request);

    List<BuildingResponse> getBuildings(String search);

    BuildingResponse getBuilding(Long id);

    BuildingResponse updateBuilding(Long id, BuildingUpsertRequest request);

    void deleteBuilding(Long id);
}
