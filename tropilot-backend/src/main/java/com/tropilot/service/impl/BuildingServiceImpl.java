package com.tropilot.service.impl;

import com.tropilot.dto.request.BuildingRequest;
import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.entity.Building;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.service.BuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BuildingServiceImpl implements BuildingService {

    private final BuildingRepository buildingRepository;
    private final BuildingMapper buildingMapper;
    private final RoomReferenceChecker roomReferenceChecker;

    @Override
    @Transactional
    public BuildingResponse createBuilding(BuildingRequest request) {
        String buildingCode = normalizeCode(request.getBuildingCode());

        if (buildingRepository.existsByBuildingCode(buildingCode)) {
            throw new BadRequestException("Building code is already in use");
        }

        Building building = Building.builder()
                .buildingCode(buildingCode)
                .name(request.getName().trim())
                .address(request.getAddress().trim())
                .floors(request.getFloors())
                .description(normalizeOptionalText(request.getDescription()))
                .build();

        return buildingMapper.toResponse(buildingRepository.save(building));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BuildingResponse> getBuildings(String search) {
        String normalizedSearch = normalizeOptionalText(search);
        List<Building> buildings = normalizedSearch == null
                ? buildingRepository.findAllByOrderByCreatedAtDesc()
                : buildingRepository.searchByCodeOrName(normalizedSearch);

        return buildings.stream()
                .map(buildingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BuildingResponse getBuilding(Long id) {
        return buildingMapper.toResponse(findBuilding(id));
    }

    @Override
    @Transactional
    public BuildingResponse updateBuilding(Long id, BuildingRequest request) {
        Building building = findBuilding(id);
        String buildingCode = normalizeCode(request.getBuildingCode());

        buildingRepository.findByBuildingCode(buildingCode)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Building code is already in use");
                });

        building.setBuildingCode(buildingCode);
        building.setName(request.getName().trim());
        building.setAddress(request.getAddress().trim());
        building.setFloors(request.getFloors());
        building.setDescription(normalizeOptionalText(request.getDescription()));

        return buildingMapper.toResponse(buildingRepository.save(building));
    }

    @Override
    @Transactional
    public void deleteBuilding(Long id) {
        Building building = findBuilding(id);

        if (roomReferenceChecker.hasRooms(id)) {
            throw new BadRequestException("Building cannot be deleted because it has related rooms");
        }

        buildingRepository.delete(building);
    }

    private Building findBuilding(Long id) {
        return buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found"));
    }

    private String normalizeCode(String buildingCode) {
        return buildingCode.trim().toUpperCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
