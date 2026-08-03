package com.tropilot.service.impl;

import com.tropilot.validation.RoomReferenceChecker;
import com.tropilot.mapper.BuildingMapper;
import com.tropilot.dto.request.BuildingUpsertRequest;
import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.BuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
/** Thực thi nghiệp vụ quản lý tòa nhà, gồm kiểm tra mã và đồng bộ mã phòng khi đổi mã tòa nhà. */
public class BuildingServiceImpl implements BuildingService {

    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final BuildingMapper buildingMapper;
    private final RoomReferenceChecker roomReferenceChecker;

    @Override
    @Transactional
    /** Kiểm tra mã tòa nhà không trùng, lưu tòa nhà mới và ghi nhật ký thao tác. */
    public BuildingResponse createBuilding(BuildingUpsertRequest request) {
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
    /** Lấy toàn bộ tòa nhà hoặc tìm theo mã, tên, địa chỉ khi có từ khóa. */
    public List<BuildingResponse> getBuildings(String search) {
        String normalizedSearch = normalizeOptionalText(search);
        List<Building> buildings = normalizedSearch == null
                ? buildingRepository.findAllByOrderByCreatedAtDesc()
                : buildingRepository.searchByCodeNameOrAddress(normalizedSearch);

        return buildings.stream()
                .map(buildingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    /** Tìm và trả về chi tiết một tòa nhà theo id. */
    public BuildingResponse getBuilding(Long id) {
        return buildingMapper.toResponse(findBuilding(id));
    }

    @Override
    @Transactional
    /** Cập nhật tòa nhà; khi mã đổi thì chuẩn hóa lại mã các phòng thuộc tòa nhà đó. */
    public BuildingResponse updateBuilding(Long id, BuildingUpsertRequest request) {
        Building building = findBuilding(id);
        String previousBuildingCode = normalizeCode(building.getBuildingCode());
        String buildingCode = normalizeCode(request.getBuildingCode());

        buildingRepository.findByBuildingCode(buildingCode)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Building code is already in use");
                });

        normalizeRoomCodes(building.getId(), previousBuildingCode, buildingCode);
        building.setBuildingCode(buildingCode);
        building.setName(request.getName().trim());
        building.setAddress(request.getAddress().trim());
        building.setFloors(request.getFloors());
        building.setDescription(normalizeOptionalText(request.getDescription()));

        return buildingMapper.toResponse(buildingRepository.save(building));
    }

    private void normalizeRoomCodes(Long buildingId, String previousBuildingCode, String newBuildingCode) {
        List<Room> rooms = roomRepository.findAllByBuilding_IdOrderByRoomCodeAsc(buildingId);
        Set<String> generatedCodes = new HashSet<>();

        for (Room room : rooms) {
            String localRoomCode = extractLocalRoomCode(room.getRoomCode(), previousBuildingCode);
            String updatedRoomCode = newBuildingCode + "-" + localRoomCode;
            validateRoomCode(updatedRoomCode);

            if (!generatedCodes.add(updatedRoomCode)) {
                throw new BadRequestException("Building code change would create duplicate room codes");
            }

            roomRepository.findByRoomCode(updatedRoomCode)
                    .filter(existing -> !existing.getId().equals(room.getId()))
                    .ifPresent(existing -> {
                        throw new BadRequestException("Building code change would create duplicate room code "
                                + updatedRoomCode);
                    });

            room.setRoomCode(updatedRoomCode);
        }

        if (!rooms.isEmpty()) {
            roomRepository.saveAllAndFlush(rooms);
        }
    }

    private String extractLocalRoomCode(String roomCode, String buildingCode) {
        String normalizedRoomCode = normalizeCode(roomCode);
        String expectedPrefix = buildingCode + "-";

        if (normalizedRoomCode.startsWith(expectedPrefix)) {
            return requireLocalRoomCode(normalizedRoomCode.substring(expectedPrefix.length()), roomCode);
        }

        int delimiterIndex = normalizedRoomCode.indexOf("-");
        if (delimiterIndex < 0) {
            return normalizedRoomCode;
        }

        return requireLocalRoomCode(normalizedRoomCode.substring(delimiterIndex + 1), roomCode);
    }

    private String requireLocalRoomCode(String localRoomCode, String originalRoomCode) {
        if (localRoomCode.isBlank()) {
            throw new BadRequestException("Room code " + originalRoomCode + " is invalid");
        }

        return localRoomCode;
    }

    private void validateRoomCode(String roomCode) {
        if (roomCode.length() > 50) {
            throw new BadRequestException("Updated room code must not exceed 50 characters");
        }
    }

    @Override
    @Transactional
    /** Xóa tòa nhà sau khi kiểm tra các dữ liệu phụ thuộc theo quy tắc nghiệp vụ. */
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
