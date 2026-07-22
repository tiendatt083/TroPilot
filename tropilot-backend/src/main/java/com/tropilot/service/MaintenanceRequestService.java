package com.tropilot.service;

import com.tropilot.dto.request.MaintenanceAssignRequest;
import com.tropilot.dto.request.MaintenanceCompleteRequest;
import com.tropilot.dto.request.MaintenanceRequestCreateRequest;
import com.tropilot.dto.response.MaintenanceRequestResponse;

import java.util.List;

public interface MaintenanceRequestService {

    MaintenanceRequestResponse createEquipmentRequest(
            Long requestedById,
            Long equipmentId,
            MaintenanceRequestCreateRequest request
    );

    List<MaintenanceRequestResponse> getResidentRequests(Long residentHeadId);

    List<MaintenanceRequestResponse> getRequests(Long buildingId);

    MaintenanceRequestResponse assignRequest(Long id, MaintenanceAssignRequest request, Long buildingId);

    void deleteRequest(Long id, Long buildingId);

    List<MaintenanceRequestResponse> getStaffRequests(Long staffId, Long buildingId);

    MaintenanceRequestResponse startRequest(Long staffId, Long id);

    MaintenanceRequestResponse completeRequest(Long staffId, Long id, MaintenanceCompleteRequest request);

}
