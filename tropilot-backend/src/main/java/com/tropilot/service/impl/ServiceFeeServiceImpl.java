package com.tropilot.service.impl;

import com.tropilot.validation.ServiceFeeUsageChecker;
import com.tropilot.mapper.ServiceFeeMapper;
import com.tropilot.dto.request.ServiceFeeUpsertRequest;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServiceFeeServiceImpl implements ServiceFeeService {

    private final ServiceFeeRepository serviceFeeRepository;
    private final BuildingRepository buildingRepository;
    private final ServiceFeeMapper serviceFeeMapper;
    private final ServiceFeeUsageChecker serviceFeeUsageChecker;

    @Override
    @Transactional
    public ServiceFeeResponse createBuildingServiceFee(Long buildingId, ServiceFeeUpsertRequest request) {
        Building building = findBuilding(buildingId);
        FeeType feeType = parseFeeType(request.getFeeType());
        CalculationType calculationType = parseCalculationType(request.getCalculationType());
        validateServiceFeeRule(feeType, calculationType, request.getVehicleType());
        validateSingleActiveUtilityFee(building.getId(), feeType, null);

        ServiceFee serviceFee = ServiceFee.builder()
                .building(building)
                .feeCode(generateFeeCode(building, feeType, request.getName()))
                .isActive(true)
                .build();
        applyValues(serviceFee, request, feeType, calculationType);

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
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
    public List<ServiceFeeResponse> getActiveBuildingServiceFees(Long buildingId) {
        findBuilding(buildingId);

        return serviceFeeRepository.findByBuilding_IdAndIsActiveTrueOrderByCreatedAtDesc(buildingId)
                .stream()
                .map(serviceFeeMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ServiceFeeResponse updateBuildingServiceFee(Long buildingId, Long id, ServiceFeeUpsertRequest request) {
        ServiceFee serviceFee = findBuildingServiceFee(buildingId, id);
        FeeType feeType = parseFeeType(request.getFeeType());
        CalculationType calculationType = parseCalculationType(request.getCalculationType());
        validateServiceFeeRule(feeType, calculationType, request.getVehicleType());

        if (Boolean.TRUE.equals(serviceFee.getIsActive())) {
            validateSingleActiveUtilityFee(buildingId, feeType, id);
        }

        applyValues(serviceFee, request, feeType, calculationType);

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    @Override
    @Transactional
    public ServiceFeeDeleteResponse deleteBuildingServiceFee(Long buildingId, Long id) {
        ServiceFee serviceFee = findBuildingServiceFee(buildingId, id);
        return deleteOrDeactivate(serviceFee);
    }

    @Override
    @Transactional
    public ServiceFeeResponse toggleBuildingServiceFee(Long buildingId, Long id) {
        ServiceFee serviceFee = findBuildingServiceFee(buildingId, id);
        boolean activating = !Boolean.TRUE.equals(serviceFee.getIsActive());

        if (activating) {
            validateSingleActiveUtilityFee(buildingId, serviceFee.getFeeType(), id);
        }

        serviceFee.setIsActive(activating);

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    private void applyValues(
            ServiceFee serviceFee,
            ServiceFeeUpsertRequest request,
            FeeType feeType,
            CalculationType calculationType
    ) {
        serviceFee.setName(request.getName().trim());
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
                && calculationType != CalculationType.FIXED
                && calculationType != CalculationType.BY_PERSON) {
            throw new BadRequestException("Electricity and water fees must be fixed, calculated by usage, or calculated by person");
        }

        if (feeType == FeeType.OTHER
                && calculationType != CalculationType.FIXED
                && calculationType != CalculationType.BY_USAGE
                && calculationType != CalculationType.BY_PERSON) {
            throw new BadRequestException("Additional services must be fixed, calculated by usage, or calculated by person");
        }

        if (normalizeOptionalText(vehicleType) != null) {
            throw new BadRequestException("Vehicle type is not used for service fees");
        }
    }

    private void validateSingleActiveUtilityFee(Long buildingId, FeeType feeType, Long excludedId) {
        if (!isUtilityFee(feeType)) {
            return;
        }

        boolean duplicateExists = excludedId == null
                ? serviceFeeRepository.existsByBuilding_IdAndFeeTypeAndIsActiveTrue(buildingId, feeType)
                : serviceFeeRepository.existsByBuilding_IdAndFeeTypeAndIsActiveTrueAndIdNot(
                        buildingId,
                        feeType,
                        excludedId
                );

        if (duplicateExists) {
            throw new BadRequestException(
                    "Only one active " + feeType.name().toLowerCase() + " fee is allowed in each building"
            );
        }
    }

    private String generateFeeCode(Building building, FeeType feeType, String feeName) {
        String buildingCode = normalizeCodePart(building.getBuildingCode(), "BUILDING");
        String feeNameCode = feeType == FeeType.OTHER
                ? "_" + normalizeCodePart(feeName, "SERVICE")
                : "";
        String baseCode = buildingCode + "_" + feeType.name() + feeNameCode;

        for (int attempt = 0; attempt < 10; attempt++) {
            String uniqueSuffix = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 8)
                    .toUpperCase();
            String candidate = truncate(baseCode, 41) + "_" + uniqueSuffix;

            if (!serviceFeeRepository.existsByBuilding_IdAndFeeCode(building.getId(), candidate)) {
                return candidate;
            }
        }

        throw new BadRequestException("Could not generate a unique internal service fee code");
    }

    private String normalizeCodePart(String value, String fallback) {
        String normalized = value == null
                ? ""
                : value.trim()
                        .toUpperCase()
                        .replaceAll("[^A-Z0-9]+", "_")
                        .replaceAll("^_+|_+$", "");

        return normalized.isBlank() ? fallback : normalized;
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private boolean isUtilityFee(FeeType feeType) {
        return feeType == FeeType.ELECTRICITY || feeType == FeeType.WATER;
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
