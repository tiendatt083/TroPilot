package com.tropilot.service;

import com.tropilot.dto.response.RentalContractResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RentalContractService {

    List<RentalContractResponse> getContracts(Long buildingId);

    RentalContractResponse getContract(Long id, Long buildingId);

    RentalContractResponse uploadContract(Long id, Long buildingId, MultipartFile file);

    RentalContractResponse getCurrentResidentContract(Long residentHeadId);

    RentalContractResponse confirmResidentContract(Long residentHeadId, Long id);

    RentalContractResponse reportResidentContractIssue(Long residentHeadId, Long id);
}
