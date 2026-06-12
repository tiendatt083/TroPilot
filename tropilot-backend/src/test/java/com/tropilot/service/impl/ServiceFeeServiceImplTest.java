package com.tropilot.service.impl;

import com.tropilot.dto.request.ServiceFeeUpsertRequest;
import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.ServiceFee;
import com.tropilot.enums.CalculationType;
import com.tropilot.enums.FeeType;
import com.tropilot.exception.BadRequestException;
import com.tropilot.mapper.ServiceFeeMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.ServiceFeeRepository;
import com.tropilot.validation.ServiceFeeUsageChecker;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceFeeServiceImplTest {

    @Mock
    private ServiceFeeRepository serviceFeeRepository;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private ServiceFeeMapper serviceFeeMapper;

    @Mock
    private ServiceFeeUsageChecker serviceFeeUsageChecker;

    @InjectMocks
    private ServiceFeeServiceImpl service;

    @Test
    void createUtilityFeeRejectsDuplicateActiveTypeInBuilding() {
        Building building = BusinessRuleTestFixtures.building();
        ServiceFeeUpsertRequest request = request("Electricity", FeeType.ELECTRICITY, CalculationType.BY_USAGE);

        when(buildingRepository.findById(building.getId())).thenReturn(Optional.of(building));
        when(serviceFeeRepository.existsByBuilding_IdAndFeeTypeAndIsActiveTrue(
                building.getId(),
                FeeType.ELECTRICITY
        )).thenReturn(true);

        assertThatThrownBy(() -> service.createBuildingServiceFee(building.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only one active electricity fee");

        verify(serviceFeeRepository, never()).save(any());
    }

    @Test
    void createServiceFeeGeneratesInternalCode() {
        Building building = BusinessRuleTestFixtures.building();
        ServiceFeeUpsertRequest request = request("Electricity", FeeType.ELECTRICITY, CalculationType.BY_USAGE);
        ServiceFeeResponse mappedResponse = ServiceFeeResponse.builder().id(10L).build();

        when(buildingRepository.findById(building.getId())).thenReturn(Optional.of(building));
        when(serviceFeeRepository.save(any(ServiceFee.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(serviceFeeMapper.toResponse(any(ServiceFee.class))).thenReturn(mappedResponse);

        ServiceFeeResponse response = service.createBuildingServiceFee(building.getId(), request);

        assertThat(response.getId()).isEqualTo(10L);
        ArgumentCaptor<ServiceFee> feeCaptor = ArgumentCaptor.forClass(ServiceFee.class);
        verify(serviceFeeRepository).save(feeCaptor.capture());
        assertThat(feeCaptor.getValue().getFeeCode())
                .startsWith("BD01_ELECTRICITY_");
    }

    @Test
    void activateUtilityFeeRejectsDuplicateActiveTypeInBuilding() {
        Building building = BusinessRuleTestFixtures.building();
        ServiceFee waterFee = BusinessRuleTestFixtures.serviceFee(
                11L,
                "Water",
                FeeType.WATER,
                CalculationType.BY_USAGE,
                "12000"
        );
        waterFee.setIsActive(false);

        when(buildingRepository.findById(building.getId())).thenReturn(Optional.of(building));
        when(serviceFeeRepository.findById(waterFee.getId())).thenReturn(Optional.of(waterFee));
        when(serviceFeeRepository.existsByBuilding_IdAndFeeTypeAndIsActiveTrueAndIdNot(
                building.getId(),
                FeeType.WATER,
                waterFee.getId()
        )).thenReturn(true);

        assertThatThrownBy(() -> service.toggleBuildingServiceFee(building.getId(), waterFee.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only one active water fee");

        assertThat(waterFee.getIsActive()).isFalse();
        verify(serviceFeeRepository, never()).save(any());
    }

    @Test
    void updateActiveFeeRejectsChangingToDuplicateUtilityType() {
        Building building = BusinessRuleTestFixtures.building();
        ServiceFee otherFee = BusinessRuleTestFixtures.serviceFee(
                12L,
                "Internet",
                FeeType.OTHER,
                CalculationType.FIXED,
                "100000"
        );
        ServiceFeeUpsertRequest request = request("Electricity", FeeType.ELECTRICITY, CalculationType.BY_USAGE);

        when(buildingRepository.findById(building.getId())).thenReturn(Optional.of(building));
        when(serviceFeeRepository.findById(otherFee.getId())).thenReturn(Optional.of(otherFee));
        when(serviceFeeRepository.existsByBuilding_IdAndFeeTypeAndIsActiveTrueAndIdNot(
                building.getId(),
                FeeType.ELECTRICITY,
                otherFee.getId()
        )).thenReturn(true);

        assertThatThrownBy(() -> service.updateBuildingServiceFee(building.getId(), otherFee.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only one active electricity fee");

        assertThat(otherFee.getFeeType()).isEqualTo(FeeType.OTHER);
        verify(serviceFeeRepository, never()).save(any());
    }

    private ServiceFeeUpsertRequest request(String name, FeeType feeType, CalculationType calculationType) {
        ServiceFeeUpsertRequest request = new ServiceFeeUpsertRequest();
        request.setName(name);
        request.setFeeType(feeType.name());
        request.setUnitPrice(new BigDecimal("3500"));
        request.setCalculationType(calculationType.name());
        return request;
    }
}
