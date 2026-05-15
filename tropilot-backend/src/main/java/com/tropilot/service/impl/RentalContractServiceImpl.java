package com.tropilot.service.impl;

import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.entity.RentalContract;
import com.tropilot.enums.ContractStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.RentalContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RentalContractServiceImpl implements RentalContractService {

    private final RentalContractRepository rentalContractRepository;
    private final RentalContractMapper rentalContractMapper;
    private final ContractFileStorageService contractFileStorageService;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional(readOnly = true)
    public List<RentalContractResponse> getContracts() {
        return rentalContractRepository.findAllWithDetails()
                .stream()
                .map(rentalContractMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RentalContractResponse getContract(Long id) {
        return rentalContractMapper.toResponse(findContract(id));
    }

    @Override
    @Transactional
    public RentalContractResponse uploadContract(Long id, MultipartFile file) {
        RentalContract contract = findContract(id);
        String fileUrl = contractFileStorageService.store(file);

        contract.setContractFileUrl(fileUrl);
        contract.setContractStatus(ContractStatus.UPLOADED);

        RentalContract savedContract = rentalContractRepository.save(contract);
        activityLogService.recordCurrentUser(
                "CONTRACT_UPLOADED",
                "Uploaded contract for room " + savedContract.getRoom().getRoomCode()
        );

        return rentalContractMapper.toResponse(savedContract);
    }

    @Override
    @Transactional
    public RentalContractResponse markNeedUpdate(Long id) {
        RentalContract contract = findContract(id);
        contract.setContractStatus(ContractStatus.NEED_UPDATE);
        return rentalContractMapper.toResponse(rentalContractRepository.save(contract));
    }

    @Override
    @Transactional(readOnly = true)
    public RentalContractResponse getCurrentResidentContract(Long residentHeadId) {
        return rentalContractMapper.toResponse(findCurrentResidentContract(residentHeadId));
    }

    @Override
    @Transactional
    public RentalContractResponse confirmResidentContract(Long residentHeadId, Long id) {
        RentalContract contract = findResidentContract(residentHeadId, id);

        if (contract.getContractFileUrl() == null || contract.getContractFileUrl().isBlank()) {
            throw new BadRequestException("Contract file must be uploaded before confirmation");
        }

        contract.setContractStatus(ContractStatus.CONFIRMED);
        RentalContract savedContract = rentalContractRepository.save(contract);
        activityLogService.record(
                savedContract.getResidentHead(),
                "CONTRACT_CONFIRMED",
                "Confirmed contract for room " + savedContract.getRoom().getRoomCode()
        );

        return rentalContractMapper.toResponse(savedContract);
    }

    @Override
    @Transactional
    public RentalContractResponse reportResidentContractIssue(Long residentHeadId, Long id) {
        RentalContract contract = findResidentContract(residentHeadId, id);
        contract.setContractStatus(ContractStatus.NEED_UPDATE);
        return rentalContractMapper.toResponse(rentalContractRepository.save(contract));
    }

    private RentalContract findContract(Long id) {
        return rentalContractRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rental contract not found"));
    }

    private RentalContract findCurrentResidentContract(Long residentHeadId) {
        return rentalContractRepository
                .findFirstByResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(residentHeadId, RentalStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Current rental contract not found"));
    }

    private RentalContract findResidentContract(Long residentHeadId, Long id) {
        RentalContract contract = findContract(id);

        if (!contract.getResidentHead().getId().equals(residentHeadId)
                || contract.getRentalStatus() != RentalStatus.ACTIVE) {
            throw new ForbiddenException("Rental contract does not belong to the current Head Resident");
        }

        RentalContract currentContract = findCurrentResidentContract(residentHeadId);
        if (!currentContract.getId().equals(id)) {
            throw new ForbiddenException("Only the current rental contract can be updated");
        }

        return contract;
    }
}
