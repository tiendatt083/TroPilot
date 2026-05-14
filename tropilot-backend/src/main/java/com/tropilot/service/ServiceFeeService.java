package com.tropilot.service;

import com.tropilot.dto.request.ServiceFeeRequest;
import com.tropilot.dto.response.ServiceFeeDeleteResponse;
import com.tropilot.dto.response.ServiceFeeResponse;

import java.util.List;

public interface ServiceFeeService {

    ServiceFeeResponse createServiceFee(ServiceFeeRequest request);

    List<ServiceFeeResponse> getServiceFees();

    ServiceFeeResponse getServiceFee(Long id);

    ServiceFeeResponse updateServiceFee(Long id, ServiceFeeRequest request);

    ServiceFeeDeleteResponse deleteServiceFee(Long id);

    ServiceFeeResponse toggleServiceFee(Long id);
}
