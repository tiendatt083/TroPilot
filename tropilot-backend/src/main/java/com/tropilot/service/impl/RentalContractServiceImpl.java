package com.tropilot.service.impl;

import com.tropilot.storage.ContractFileStorageService;
import com.tropilot.mapper.RentalContractMapper;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.RentalContractFileHistory;
import com.tropilot.entity.User;
import com.tropilot.enums.ContractStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RentalContractFileHistoryRepository;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.security.CurrentUserProvider;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.NotificationService;
import com.tropilot.service.RentalContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RentalContractServiceImpl implements RentalContractService {

    private final RentalContractRepository rentalContractRepository;
    private final RentalContractFileHistoryRepository rentalContractFileHistoryRepository;
    private final BuildingRepository buildingRepository;
    private final RentalContractMapper rentalContractMapper;
    private final ContractFileStorageService contractFileStorageService;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @Override
    @Transactional(readOnly = true)
    public List<RentalContractResponse> getContracts(Long buildingId) {
        List<RentalContract> contracts = buildingId == null
                ? rentalContractRepository.findByRentalStatusAndAssignmentStatusWithDetails(
                        RentalStatus.ACTIVE,
                        RoomAssignmentStatus.ACTIVE
                )
                : getActiveBuildingContracts(buildingId);

        return contracts
                .stream()
                .map(rentalContractMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RentalContractResponse getContract(Long id, Long buildingId) {
        RentalContract contract = findActiveContract(id);
        validateContractBelongsToBuilding(contract, buildingId);
        return toResponseWithHistory(contract);
    }

    @Override
    @Transactional
    public RentalContractResponse uploadContract(Long id, Long buildingId, MultipartFile file) {
        RentalContract contract = findActiveContract(id);
        validateContractBelongsToBuilding(contract, buildingId);
        User currentUser = currentUserProvider.getCurrentUser();
        String previousFileUrl = contract.getContractFileUrl();
        boolean replacingExistingFile = hasText(previousFileUrl);
        String fileUrl = contractFileStorageService.store(file);

        if (replacingExistingFile) {
            rentalContractFileHistoryRepository.save(RentalContractFileHistory.builder()
                    .rentalContract(contract)
                    .fileUrl(previousFileUrl)
                    .replacedBy(currentUser)
                    .build());
        }

        contract.setContractFileUrl(fileUrl);
        contract.setContractStatus(ContractStatus.UPLOADED);

        RentalContract savedContract = rentalContractRepository.save(contract);
        if (replacingExistingFile) {
            notificationService.createContractUpdatedNotification(currentUser, savedContract);
            activityLogService.recordCurrentUser(
                    "CONTRACT_UPDATED",
                    "Changed contract file for room " + savedContract.getRoom().getRoomCode()
            );
        } else {
            activityLogService.recordCurrentUser(
                    "CONTRACT_UPLOADED",
                    "Uploaded contract for room " + savedContract.getRoom().getRoomCode()
            );
        }

        return toResponseWithHistory(savedContract);
    }

    @Override
    @Transactional
    public RentalContractResponse markNeedUpdate(Long id, Long buildingId) {
        RentalContract contract = findActiveContract(id);
        validateContractBelongsToBuilding(contract, buildingId);
        contract.setContractStatus(ContractStatus.NEED_UPDATE);
        return rentalContractMapper.toResponse(rentalContractRepository.save(contract));
    }

    @Override
    @Transactional(readOnly = true)
    public RentalContractResponse getCurrentResidentContract(Long residentHeadId) {
        return toResponseWithHistory(findCurrentResidentContract(residentHeadId));
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

        return toResponseWithHistory(savedContract);
    }

    @Override
    @Transactional
    public RentalContractResponse reportResidentContractIssue(Long residentHeadId, Long id) {
        RentalContract contract = findResidentContract(residentHeadId, id);
        contract.setContractStatus(ContractStatus.NEED_UPDATE);
        return toResponseWithHistory(rentalContractRepository.save(contract));
    }

    private RentalContractResponse toResponseWithHistory(RentalContract contract) {
        return rentalContractMapper.toResponse(
                contract,
                rentalContractFileHistoryRepository.findByRentalContract_IdOrderByReplacedAtDesc(contract.getId())
        );
    }

    private RentalContract findContract(Long id) {
        return rentalContractRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rental contract not found"));
    }

    private RentalContract findActiveContract(Long id) {
        return rentalContractRepository.findByIdAndRentalStatusAndAssignmentStatusWithDetails(
                        id,
                        RentalStatus.ACTIVE,
                        RoomAssignmentStatus.ACTIVE
                )
                .orElseThrow(() -> new ResourceNotFoundException("Active rental contract not found"));
    }

    private List<RentalContract> getActiveBuildingContracts(Long buildingId) {
        validateBuildingExists(buildingId);
        return rentalContractRepository.findByBuildingIdAndRentalStatusAndAssignmentStatusWithDetails(
                buildingId,
                RentalStatus.ACTIVE,
                RoomAssignmentStatus.ACTIVE
        );
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validateContractBelongsToBuilding(RentalContract contract, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(contract.getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Rental contract does not belong to the selected building");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private RentalContract findCurrentResidentContract(Long residentHeadId) {
        return rentalContractRepository
                .findCurrentByResidentHeadIdWithDetails(
                        residentHeadId,
                        RentalStatus.ACTIVE,
                        RoomAssignmentStatus.ACTIVE
                )
                .stream()
                .findFirst()
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
