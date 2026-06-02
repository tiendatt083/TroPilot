package com.tropilot.service.impl;

import com.tropilot.dto.request.ServiceFeeRequest;
import com.tropilot.dto.response.ServiceFeeDeleteResponse;
import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.ServiceFee;
import com.tropilot.enums.CalculationType;
import com.tropilot.enums.FeeType;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.ServiceFeeRepository;
import com.tropilot.service.ServiceFeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ServiceFeeServiceImpl implements ServiceFeeService {

    private final ServiceFeeRepository serviceFeeRepository;
    private final BuildingRepository buildingRepository;
    private final ServiceFeeMapper serviceFeeMapper;
    private final ServiceFeeUsageChecker serviceFeeUsageChecker;

    @Override
    @Transactional
    public ServiceFeeResponse createServiceFee(ServiceFeeRequest request) {
        String feeCode = normalizeCode(request.getFeeCode());

        if (serviceFeeRepository.existsByFeeCode(feeCode)) {
            throw new BadRequestException("Service fee code is already in use");
        }

        ServiceFee serviceFee = ServiceFee.builder()
                .isActive(true)
                .build();
        applyValues(serviceFee, request, feeCode);

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    @Override
    @Transactional
    public ServiceFeeResponse createBuildingServiceFee(Long buildingId, ServiceFeeRequest request) {
        Building building = findBuilding(buildingId);
        String feeCode = normalizeCode(request.getFeeCode());

        if (serviceFeeRepository.existsByBuilding_IdAndFeeCode(building.getId(), feeCode)) {
            throw new BadRequestException("Service fee code is already in use in this building");
        }

        ServiceFee serviceFee = ServiceFee.builder()
                .building(building)
                .isActive(true)
                .build();
        applyValues(serviceFee, request, feeCode);

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceFeeResponse> getServiceFees() {
        return serviceFeeRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(serviceFeeMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceFeeResponse> getBuildingServiceFees(Long buildingId) {
        findBuilding(buildingId);

        return serviceFeeRepository.findByBuilding_IdOrderByCreatedAtDesc(buildingId)
                .stream()
                .map(serviceFeeMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceFeeResponse getServiceFee(Long id) {
        return serviceFeeMapper.toResponse(findServiceFee(id));
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceFeeResponse getBuildingServiceFee(Long buildingId, Long id) {
        ServiceFee serviceFee = findBuildingServiceFee(buildingId, id);
        return serviceFeeMapper.toResponse(serviceFee);
    }

    @Override
    @Transactional
    public ServiceFeeResponse updateServiceFee(Long id, ServiceFeeRequest request) {
        ServiceFee serviceFee = findServiceFee(id);
        String feeCode = normalizeCode(request.getFeeCode());

        serviceFeeRepository.findByFeeCode(feeCode)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Service fee code is already in use");
                });

        applyValues(serviceFee, request, feeCode);

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    @Override
    @Transactional
    public ServiceFeeResponse updateBuildingServiceFee(Long buildingId, Long id, ServiceFeeRequest request) {
        ServiceFee serviceFee = findBuildingServiceFee(buildingId, id);
        String feeCode = normalizeCode(request.getFeeCode());

        serviceFeeRepository.findByBuilding_IdAndFeeCode(buildingId, feeCode)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Service fee code is already in use in this building");
                });

        applyValues(serviceFee, request, feeCode);

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    @Override
    @Transactional
    public ServiceFeeDeleteResponse deleteServiceFee(Long id) {
        ServiceFee serviceFee = findServiceFee(id);
        return deleteOrDeactivate(serviceFee);
    }

    @Override
    @Transactional
    public ServiceFeeDeleteResponse deleteBuildingServiceFee(Long buildingId, Long id) {
        ServiceFee serviceFee = findBuildingServiceFee(buildingId, id);
        return deleteOrDeactivate(serviceFee);
    }

    @Override
    @Transactional
    public ServiceFeeResponse toggleServiceFee(Long id) {
        ServiceFee serviceFee = findServiceFee(id);
        serviceFee.setIsActive(!Boolean.TRUE.equals(serviceFee.getIsActive()));

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    @Override
    @Transactional
    public ServiceFeeResponse toggleBuildingServiceFee(Long buildingId, Long id) {
        ServiceFee serviceFee = findBuildingServiceFee(buildingId, id);
        serviceFee.setIsActive(!Boolean.TRUE.equals(serviceFee.getIsActive()));

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    private void applyValues(ServiceFee serviceFee, ServiceFeeRequest request, String feeCode) {
        FeeType feeType = parseFeeType(request.getFeeType());
        CalculationType calculationType = parseCalculationType(request.getCalculationType());

        validateServiceFeeRule(feeType, calculationType, request.getVehicleType());

        serviceFee.setName(request.getName().trim());
        serviceFee.setFeeCode(feeCode);
        serviceFee.setFeeType(feeType);
        serviceFee.setUnitPrice(request.getUnitPrice());
        serviceFee.setCalculationType(calculationType);
        serviceFee.setVehicleType(null);
    }

    private ServiceFeeDeleteResponse deleteOrDeactivate(ServiceFee serviceFee) {
        if (serviceFeeUsageChecker.hasInvoiceItems(serviceFee.getId())) {
            serviceFee.setIsActive(false);
            ServiceFee savedServiceFee = serviceFeeRepository.save(serviceFee);

            return ServiceFeeDeleteResponse.builder()
                    .id(savedServiceFee.getId())
                    .deleted(false)
                    .deactivated(true)
                    .isActive(savedServiceFee.getIsActive())
                    .build();
        }

        Long id = serviceFee.getId();
        serviceFeeRepository.delete(serviceFee);

        return ServiceFeeDeleteResponse.builder()
                .id(id)
                .deleted(true)
                .deactivated(false)
                .isActive(false)
                .build();
    }

    private ServiceFee findServiceFee(Long id) {
        return serviceFeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service fee not found"));
    }

    private ServiceFee findBuildingServiceFee(Long buildingId, Long id) {
        findBuilding(buildingId);
        ServiceFee serviceFee = findServiceFee(id);

        if (serviceFee.getBuilding() == null || !Objects.equals(serviceFee.getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Service fee does not belong to the selected building");
        }

        return serviceFee;
    }

    private Building findBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found"));
    }

    private FeeType parseFeeType(String feeType) {
        try {
            return FeeType.valueOf(feeType.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid fee type");
        }
    }

    private CalculationType parseCalculationType(String calculationType) {
        try {
            return CalculationType.valueOf(calculationType.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid calculation type");
        }
    }

    private void validateServiceFeeRule(FeeType feeType, CalculationType calculationType, String vehicleType) {
        if (feeType != FeeType.ELECTRICITY && feeType != FeeType.WATER && feeType != FeeType.OTHER) {
            throw new BadRequestException("Only electricity, water, and other service fees can be configured");
        }

        if ((feeType == FeeType.ELECTRICITY || feeType == FeeType.WATER)
                && calculationType != CalculationType.BY_USAGE
                && calculationType != CalculationType.BY_PERSON) {
            throw new BadRequestException("Electricity and water fees must be calculated by usage or by person");
        }

        if (feeType == FeeType.OTHER
                && calculationType != CalculationType.FIXED
                && calculationType != CalculationType.BY_PERSON) {
            throw new BadRequestException("Additional services must be fixed or calculated by person");
        }

        if (normalizeOptionalText(vehicleType) != null) {
            throw new BadRequestException("Vehicle type is not used for service fees");
        }
    }

    private String normalizeCode(String feeCode) {
        return feeCode.trim().toUpperCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
