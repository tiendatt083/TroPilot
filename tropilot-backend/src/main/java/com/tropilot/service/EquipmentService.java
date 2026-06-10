package com.tropilot.service;

import com.tropilot.dto.request.EquipmentUpsertRequest;
import com.tropilot.dto.response.EquipmentDeleteResponse;
import com.tropilot.dto.response.EquipmentMaintenanceHistoryResponse;
import com.tropilot.dto.response.EquipmentResponse;

import java.util.List;

public interface EquipmentService {

    EquipmentResponse createEquipment(Long buildingId, EquipmentUpsertRequest request);

    List<EquipmentResponse> getAdminBuildingEquipment(
            Long buildingId,
            String scope,
            Long roomId,
            String condition
    );

    List<EquipmentResponse> getStaffBuildingEquipment(
            Long buildingId,
            String scope,
            Long roomId,
            String condition
    );

    List<EquipmentResponse> getResidentEquipment(Long residentHeadId);

    EquipmentResponse getEquipment(Long id);

    EquipmentResponse updateEquipment(Long buildingId, Long id, EquipmentUpsertRequest request);

    EquipmentDeleteResponse deleteEquipment(Long buildingId, Long id);

    List<EquipmentMaintenanceHistoryResponse> getMaintenanceHistory(Long equipmentId);
}
