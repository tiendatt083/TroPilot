package com.tropilot.service;

import com.tropilot.dto.request.VehicleRequest;
import com.tropilot.dto.response.VehicleResponse;

import java.util.List;

public interface VehicleService {

    VehicleResponse requestVehicle(Long residentHeadId, VehicleRequest request);

    List<VehicleResponse> getResidentVehicles(Long residentHeadId);

    VehicleResponse requestCancel(Long residentHeadId, Long id);

    List<VehicleResponse> getVehicles();

    List<VehicleResponse> getPendingVehicles();

    VehicleResponse approveVehicle(Long id);

    VehicleResponse rejectVehicle(Long id);

    VehicleResponse deactivateVehicle(Long id);
}
