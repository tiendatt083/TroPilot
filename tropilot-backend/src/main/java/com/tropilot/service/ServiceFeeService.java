package com.tropilot.service;

import com.tropilot.dto.request.ServiceFeeUpsertRequest;
import com.tropilot.dto.response.ServiceFeeDeleteResponse;
import com.tropilot.dto.response.ServiceFeeResponse;

import java.util.List;

/** Hợp đồng quản lý khoản phí dịch vụ của từng tòa nhà, gồm bật/tắt và xóa. */
public interface ServiceFeeService {

    ServiceFeeResponse createBuildingServiceFee(Long buildingId, ServiceFeeUpsertRequest request);

    List<ServiceFeeResponse> getBuildingServiceFees(Long buildingId);

    List<ServiceFeeResponse> getActiveBuildingServiceFees(Long buildingId);

    ServiceFeeResponse updateBuildingServiceFee(Long buildingId, Long id, ServiceFeeUpsertRequest request);

    ServiceFeeDeleteResponse deleteBuildingServiceFee(Long buildingId, Long id);

    ServiceFeeResponse toggleBuildingServiceFee(Long buildingId, Long id);
}
