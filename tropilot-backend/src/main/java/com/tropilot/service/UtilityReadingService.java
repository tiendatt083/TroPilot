package com.tropilot.service;

import com.tropilot.dto.request.UtilityReadingCreateRequest;
import com.tropilot.dto.request.UtilityReadingUpdateRequest;
import com.tropilot.dto.response.UtilityReadingResponse;

import java.util.List;

public interface UtilityReadingService {

    UtilityReadingResponse createReading(UtilityReadingCreateRequest request, Long createdById);

    List<UtilityReadingResponse> getReadings(Long buildingId);

    UtilityReadingResponse getReading(Long id);

    UtilityReadingResponse updateReading(Long id, UtilityReadingUpdateRequest request);

    List<UtilityReadingResponse> getCurrentResidentRoomReadings(Long residentHeadId);
}
