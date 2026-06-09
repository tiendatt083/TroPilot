package com.tropilot.service.impl;

import com.tropilot.validation.RoomDeletionGuard;
import com.tropilot.mapper.RoomMapper;
import com.tropilot.dto.request.RoomUpsertRequest;
import com.tropilot.dto.response.RoomResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.enums.RoomStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final BuildingRepository buildingRepository;
    private final RoomMapper roomMapper;
    private final RoomDeletionGuard roomDeletionGuard;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public RoomResponse createRoom(RoomUpsertRequest request) {
        Building building = findBuilding(request.getBuildingId());
        String roomCode = buildRoomCode(building, request.getRoomCode());
        RoomStatus roomStatus = parseRequiredStatus(request.getStatus());

        if (roomRepository.existsByRoomCode(roomCode)) {
            throw new BadRequestException("Room code is already in use");
        }

        validateFloor(building, request.getFloor());

        Room room = Room.builder()
                .building(building)
                .roomCode(roomCode)
                .roomName(request.getRoomName().trim())
                .floor(request.getFloor())
                .price(request.getPrice())
                .area(request.getArea())
                .maxOccupants(request.getMaxOccupants())
                .status(roomStatus)
                .description(normalizeOptionalText(request.getDescription()))
                .build();

        Room savedRoom = roomRepository.save(room);
        activityLogService.recordCurrentUser(
                "ROOM_CREATED",
                "Created room " + savedRoom.getRoomCode() + " in building " + building.getBuildingCode()
        );

        return roomMapper.toResponse(savedRoom);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> getRooms(Long buildingId, String status, String search) {
        if (buildingId != null && !buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }

        RoomStatus roomStatus = parseStatus(status);
        String normalizedSearch = normalizeOptionalText(search);

        return roomRepository.findByFilters(buildingId, roomStatus, normalizedSearch)
                .stream()
                .map(roomMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoomResponse getRoom(Long id) {
        return roomMapper.toResponse(findRoom(id));
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(Long id, RoomUpsertRequest request) {
        Room room = findRoom(id);
        Building building = findBuilding(request.getBuildingId());
        String roomCode = buildRoomCode(building, request.getRoomCode());
        RoomStatus roomStatus = parseRequiredStatus(request.getStatus());

        roomRepository.findByRoomCode(roomCode)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Room code is already in use");
                });

        validateFloor(building, request.getFloor());

        room.setBuilding(building);
        room.setRoomCode(roomCode);
        room.setRoomName(request.getRoomName().trim());
        room.setFloor(request.getFloor());
        room.setPrice(request.getPrice());
        room.setArea(request.getArea());
        room.setMaxOccupants(request.getMaxOccupants());
        room.setStatus(roomStatus);
        room.setDescription(normalizeOptionalText(request.getDescription()));

        return roomMapper.toResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public void deleteRoom(Long id) {
        Room room = findRoom(id);

        if (roomDeletionGuard.hasRelatedData(id)) {
            throw new BadRequestException("Room cannot be deleted because it has related data");
        }

        roomRepository.delete(room);
    }

    private Room findRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    private Building findBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found"));
    }

    private void validateFloor(Building building, Integer floor) {
        if (floor > building.getFloors()) {
            throw new BadRequestException("Room floor cannot be greater than building floors");
        }
    }

    private RoomStatus parseStatus(String status) {
        String normalizedStatus = normalizeOptionalText(status);
        if (normalizedStatus == null) {
            return null;
        }

        try {
            return RoomStatus.valueOf(normalizedStatus.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid room status");
        }
    }

    private RoomStatus parseRequiredStatus(String status) {
        RoomStatus roomStatus = parseStatus(status);
        if (roomStatus == null) {
            throw new BadRequestException("Room status is required");
        }

        return roomStatus;
    }

    private String normalizeCode(String roomCode) {
        return roomCode.trim().toUpperCase();
    }

    private String buildRoomCode(Building building, String requestedRoomCode) {
        String normalizedRoomCode = normalizeCode(requestedRoomCode);
        String selectedBuildingCode = normalizeCode(building.getBuildingCode());
        String buildingPrefix = selectedBuildingCode + "-";

        if (normalizedRoomCode.startsWith(buildingPrefix)) {
            validateRoomCodeLength(normalizedRoomCode);
            return normalizedRoomCode;
        }

        if (hasDifferentBuildingPrefix(normalizedRoomCode, selectedBuildingCode)) {
            throw new BadRequestException("Room code must use the selected building code prefix");
        }

        String fullRoomCode = buildingPrefix + normalizedRoomCode;
        validateRoomCodeLength(fullRoomCode);
        return fullRoomCode;
    }

    private boolean hasDifferentBuildingPrefix(String roomCode, String selectedBuildingCode) {
        int delimiterIndex = roomCode.indexOf("-");
        if (delimiterIndex <= 0) {
            return false;
        }

        String possibleBuildingCode = roomCode.substring(0, delimiterIndex);
        return !possibleBuildingCode.equals(selectedBuildingCode)
                && buildingRepository.existsByBuildingCode(possibleBuildingCode);
    }

    private void validateRoomCodeLength(String roomCode) {
        if (roomCode.length() > 50) {
            throw new BadRequestException("Room code must not exceed 50 characters");
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
