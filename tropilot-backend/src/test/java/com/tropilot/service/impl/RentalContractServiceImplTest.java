package com.tropilot.service.impl;

import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.entity.RentalContract;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.mapper.RentalContractMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RentalContractFileHistoryRepository;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.security.CurrentUserProvider;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.NotificationService;
import com.tropilot.storage.ContractFileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
/** Kiểm tra màn quản lý chỉ trả về hợp đồng thuê còn hiệu lực và đúng phạm vi tòa nhà. */
class RentalContractServiceImplTest {

    @Mock
    private RentalContractRepository rentalContractRepository;

    @Mock
    private RentalContractFileHistoryRepository rentalContractFileHistoryRepository;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private RentalContractMapper rentalContractMapper;

    @Mock
    private ContractFileStorageService contractFileStorageService;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @InjectMocks
    private RentalContractServiceImpl service;

    @Test
    void getContractsReturnsOnlyActiveRentalContracts() {
        RentalContract activeContract = BusinessRuleTestFixtures.activeContract(
                BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED),
                BusinessRuleTestFixtures.residentHead()
        );
        RentalContractResponse response = RentalContractResponse.builder()
                .id(activeContract.getId())
                .rentalStatus(RentalStatus.ACTIVE)
                .build();

        when(rentalContractRepository.findByRentalStatusAndAssignmentStatusWithDetails(
                RentalStatus.ACTIVE,
                RoomAssignmentStatus.ACTIVE
        ))
                .thenReturn(List.of(activeContract));
        when(rentalContractMapper.toResponse(activeContract)).thenReturn(response);

        List<RentalContractResponse> contracts = service.getContracts(null);

        assertThat(contracts).containsExactly(response);
        verify(rentalContractRepository).findByRentalStatusAndAssignmentStatusWithDetails(
                RentalStatus.ACTIVE,
                RoomAssignmentStatus.ACTIVE
        );
    }

    @Test
    void getBuildingContractsReturnsOnlyActiveContractsFromSelectedBuilding() {
        Long buildingId = BusinessRuleTestFixtures.BUILDING_ID;
        RentalContract activeContract = BusinessRuleTestFixtures.activeContract(
                BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED),
                BusinessRuleTestFixtures.residentHead()
        );
        RentalContractResponse response = RentalContractResponse.builder()
                .id(activeContract.getId())
                .buildingId(buildingId)
                .rentalStatus(RentalStatus.ACTIVE)
                .build();

        when(buildingRepository.existsById(buildingId)).thenReturn(true);
        when(rentalContractRepository.findByBuildingIdAndRentalStatusAndAssignmentStatusWithDetails(
                buildingId,
                RentalStatus.ACTIVE,
                RoomAssignmentStatus.ACTIVE
        )).thenReturn(List.of(activeContract));
        when(rentalContractMapper.toResponse(activeContract)).thenReturn(response);

        List<RentalContractResponse> contracts = service.getContracts(buildingId);

        assertThat(contracts).containsExactly(response);
        verify(rentalContractRepository).findByBuildingIdAndRentalStatusAndAssignmentStatusWithDetails(
                buildingId,
                RentalStatus.ACTIVE,
                RoomAssignmentStatus.ACTIVE
        );
    }

    @Test
    void getContractDoesNotExposeEndedContractInCurrentManagementFlow() {
        Long contractId = 200L;
        when(rentalContractRepository.findByIdAndRentalStatusAndAssignmentStatusWithDetails(
                contractId,
                RentalStatus.ACTIVE,
                RoomAssignmentStatus.ACTIVE
        )).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getContract(contractId, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Active rental contract not found");
    }
}
