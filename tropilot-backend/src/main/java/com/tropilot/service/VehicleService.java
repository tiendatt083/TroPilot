package com.tropilot.service;

import com.tropilot.dto.request.VehicleRequest;
import com.tropilot.dto.response.VehicleResponse;

import java.util.List;

public interface VehicleService {

    VehicleResponse requestVehicle(Long residentHeadId, VehicleRequest request);

    List<VehicleResponse> getResidentVehicles(Long residentHeadId);

    VehicleResponse requestCancel(Long residentHeadId, Long id);

    List<VehicleResponse> getVehicles(Long buildingId);

    List<VehicleResponse> getPendingVehicles(Long buildingId);

    VehicleResponse approveVehicle(Long id, Long buildingId);

    VehicleResponse rejectVehicle(Long id, Long buildingId);

    VehicleResponse deactivateVehicle(Long id, Long buildingId);
}
