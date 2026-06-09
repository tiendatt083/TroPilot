package com.tropilot.service;

import com.tropilot.dto.request.ServiceFeeUpsertRequest;
import com.tropilot.dto.response.ServiceFeeDeleteResponse;
import com.tropilot.dto.response.ServiceFeeResponse;

import java.util.List;

public interface ServiceFeeService {

    ServiceFeeResponse createBuildingServiceFee(Long buildingId, ServiceFeeUpsertRequest request);

    List<ServiceFeeResponse> getBuildingServiceFees(Long buildingId);

    ServiceFeeResponse getBuildingServiceFee(Long buildingId, Long id);

    ServiceFeeResponse updateBuildingServiceFee(Long buildingId, Long id, ServiceFeeUpsertRequest request);

    ServiceFeeDeleteResponse deleteBuildingServiceFee(Long buildingId, Long id);

    ServiceFeeResponse toggleBuildingServiceFee(Long buildingId, Long id);
}
