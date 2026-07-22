package com.tropilot.service;

import com.tropilot.dto.request.AdminVehicleCreateRequest;
import com.tropilot.dto.request.VehicleRegistrationRequest;
import com.tropilot.dto.response.VehicleResponse;

import java.util.List;

public interface VehicleService {

    VehicleResponse requestVehicle(Long residentHeadId, VehicleRegistrationRequest request);

    List<VehicleResponse> getResidentVehicles(Long residentHeadId);

    VehicleResponse requestCancel(Long residentHeadId, Long id);

    List<VehicleResponse> getVehicles(Long buildingId);

    VehicleResponse createAdminVehicle(AdminVehicleCreateRequest request, Long buildingId);

    VehicleResponse approveVehicle(Long id, Long buildingId);

    VehicleResponse rejectVehicle(Long id, Long rejectedById, Long buildingId);

    void deleteVehicle(Long id, Long buildingId);
}
