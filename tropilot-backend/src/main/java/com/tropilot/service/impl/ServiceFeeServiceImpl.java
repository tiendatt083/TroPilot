package com.tropilot.service.impl;

import com.tropilot.dto.request.ServiceFeeRequest;
import com.tropilot.dto.response.ServiceFeeDeleteResponse;
import com.tropilot.dto.response.ServiceFeeResponse;
import com.tropilot.entity.ServiceFee;
import com.tropilot.enums.CalculationType;
import com.tropilot.enums.FeeType;
import com.tropilot.enums.VehicleType;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.ServiceFeeRepository;
import com.tropilot.service.ServiceFeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceFeeServiceImpl implements ServiceFeeService {

    private final ServiceFeeRepository serviceFeeRepository;
    private final ServiceFeeMapper serviceFeeMapper;
    private final ServiceFeeUsageChecker serviceFeeUsageChecker;

    @Override
    @Transactional
    public ServiceFeeResponse createServiceFee(ServiceFeeRequest request) {
        String feeCode = normalizeCode(request.getFeeCode());

        if (serviceFeeRepository.existsByFeeCode(feeCode)) {
            throw new BadRequestException("Service fee code is already in use");
        }

        FeeType feeType = parseFeeType(request.getFeeType());
        CalculationType calculationType = parseCalculationType(request.getCalculationType());
        VehicleType vehicleType = resolveVehicleType(feeType, calculationType, request.getVehicleType());

        ServiceFee serviceFee = ServiceFee.builder()
                .name(request.getName().trim())
                .feeCode(feeCode)
                .feeType(feeType)
                .unitPrice(request.getUnitPrice())
                .calculationType(calculationType)
                .vehicleType(vehicleType)
                .isActive(true)
                .build();

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
    public ServiceFeeResponse getServiceFee(Long id) {
        return serviceFeeMapper.toResponse(findServiceFee(id));
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

        FeeType feeType = parseFeeType(request.getFeeType());
        CalculationType calculationType = parseCalculationType(request.getCalculationType());
        VehicleType vehicleType = resolveVehicleType(feeType, calculationType, request.getVehicleType());

        serviceFee.setName(request.getName().trim());
        serviceFee.setFeeCode(feeCode);
        serviceFee.setFeeType(feeType);
        serviceFee.setUnitPrice(request.getUnitPrice());
        serviceFee.setCalculationType(calculationType);
        serviceFee.setVehicleType(vehicleType);

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    @Override
    @Transactional
    public ServiceFeeDeleteResponse deleteServiceFee(Long id) {
        ServiceFee serviceFee = findServiceFee(id);

        if (serviceFeeUsageChecker.hasInvoiceItems(id)) {
            serviceFee.setIsActive(false);
            ServiceFee savedServiceFee = serviceFeeRepository.save(serviceFee);

            return ServiceFeeDeleteResponse.builder()
                    .id(savedServiceFee.getId())
                    .deleted(false)
                    .deactivated(true)
                    .isActive(savedServiceFee.getIsActive())
                    .build();
        }

        serviceFeeRepository.delete(serviceFee);

        return ServiceFeeDeleteResponse.builder()
                .id(id)
                .deleted(true)
                .deactivated(false)
                .isActive(false)
                .build();
    }

    @Override
    @Transactional
    public ServiceFeeResponse toggleServiceFee(Long id) {
        ServiceFee serviceFee = findServiceFee(id);
        serviceFee.setIsActive(!Boolean.TRUE.equals(serviceFee.getIsActive()));

        return serviceFeeMapper.toResponse(serviceFeeRepository.save(serviceFee));
    }

    private ServiceFee findServiceFee(Long id) {
        return serviceFeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service fee not found"));
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

    private VehicleType resolveVehicleType(FeeType feeType, CalculationType calculationType, String vehicleType) {
        String normalizedVehicleType = normalizeOptionalText(vehicleType);

        if (feeType != FeeType.PARKING) {
            if (normalizedVehicleType != null) {
                throw new BadRequestException("Vehicle type can only be set for parking fees");
            }

            return null;
        }

        if (calculationType == CalculationType.BY_QUANTITY && normalizedVehicleType == null) {
            throw new BadRequestException("Vehicle type is required for parking fees calculated by quantity");
        }

        if (normalizedVehicleType == null) {
            return null;
        }

        try {
            return VehicleType.valueOf(normalizedVehicleType.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid vehicle type");
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
