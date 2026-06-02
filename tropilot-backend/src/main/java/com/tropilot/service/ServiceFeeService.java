package com.tropilot.service;

import com.tropilot.dto.request.ServiceFeeRequest;
import com.tropilot.dto.response.ServiceFeeDeleteResponse;
import com.tropilot.dto.response.ServiceFeeResponse;

import java.util.List;

public interface ServiceFeeService {

    ServiceFeeResponse createServiceFee(ServiceFeeRequest request);

    ServiceFeeResponse createBuildingServiceFee(Long buildingId, ServiceFeeRequest request);

    List<ServiceFeeResponse> getServiceFees();

    List<ServiceFeeResponse> getBuildingServiceFees(Long buildingId);

    ServiceFeeResponse getServiceFee(Long id);

    ServiceFeeResponse getBuildingServiceFee(Long buildingId, Long id);

    ServiceFeeResponse updateServiceFee(Long id, ServiceFeeRequest request);

    ServiceFeeResponse updateBuildingServiceFee(Long buildingId, Long id, ServiceFeeRequest request);

    ServiceFeeDeleteResponse deleteServiceFee(Long id);

    ServiceFeeDeleteResponse deleteBuildingServiceFee(Long buildingId, Long id);

    ServiceFeeResponse toggleServiceFee(Long id);

    ServiceFeeResponse toggleBuildingServiceFee(Long buildingId, Long id);
}
