package com.tropilot.service;

import com.tropilot.dto.response.RentalContractResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RentalContractService {

    List<RentalContractResponse> getContracts();

    RentalContractResponse getContract(Long id);

    RentalContractResponse uploadContract(Long id, MultipartFile file);

    RentalContractResponse markNeedUpdate(Long id);

    RentalContractResponse getCurrentResidentContract(Long residentHeadId);

    RentalContractResponse confirmResidentContract(Long residentHeadId, Long id);

    RentalContractResponse reportResidentContractIssue(Long residentHeadId, Long id);
}
