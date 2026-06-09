package com.tropilot.service.impl;

import com.tropilot.storage.UtilityReadingImageStorageService;
import com.tropilot.mapper.UtilityReadingMapper;
import com.tropilot.mapper.RoomMapper;
import com.tropilot.dto.request.UtilityReadingCreateRequest;
import com.tropilot.dto.request.UtilityReadingUpdateRequest;
import com.tropilot.dto.response.RoomResponse;
import com.tropilot.dto.response.UtilityReadingOverviewResponse;
import com.tropilot.dto.response.UtilityReadingResponse;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.entity.UtilityReading;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.repository.UtilityReadingRepository;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.UtilityReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilityReadingServiceImpl implements UtilityReadingService {

    private final UtilityReadingRepository utilityReadingRepository;
    private final RoomRepository roomRepository;
    private final BuildingRepository buildingRepository;
    private final UserRepository userRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RoomMapper roomMapper;
    private final UtilityReadingMapper utilityReadingMapper;
    private final UtilityReadingImageStorageService imageStorageService;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public UtilityReadingResponse createReading(UtilityReadingCreateRequest request, Long createdById) {
        Room room = findRoom(request.getRoomId());
        validateRoomBelongsToBuilding(room, request.getBuildingId());
        validateRoomCanReceiveUtilityReading(room);
        User createdBy = findUser(createdById);
        LocalDate readingDate = parseReadingDate(request.getReadingDate(), request.getMonth());
        LocalDate month = readingDate.withDayOfMonth(1);

        validateReadings(
                request.getOldElectricity(),
                request.getNewElectricity(),
                request.getOldWater(),
                request.getNewWater()
        );

        if (utilityReadingRepository.existsByRoom_IdAndMonth(room.getId(), month)) {
            throw new BadRequestException("Utility reading already exists for this room and month");
        }

        UtilityReading reading = UtilityReading.builder()
                .room(room)
                .month(month)
                .readingDate(readingDate)
                .oldElectricity(request.getOldElectricity())
                .newElectricity(request.getNewElectricity())
                .electricityImageUrl(imageStorageService.store(
                        request.getElectricityImage(),
                        "Electricity evidence image"
                ))
                .oldWater(request.getOldWater())
                .newWater(request.getNewWater())
                .waterImageUrl(imageStorageService.store(request.getWaterImage(), "Water evidence image"))
                .createdBy(createdBy)
                .build();

        UtilityReading savedReading = utilityReadingRepository.save(reading);
        activityLogService.record(
                createdBy,
                "UTILITY_READING_RECORDED",
                "Recorded utility reading for room " + room.getRoomCode() + " on " + readingDate
        );

        return toResponseWithPreviousReading(savedReading);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UtilityReadingResponse> getReadings(Long buildingId) {
        List<UtilityReading> readings;

        if (buildingId == null) {
            readings = utilityReadingRepository.findAllWithDetails();
        } else {
            validateBuildingExists(buildingId);
            readings = utilityReadingRepository.findByBuildingIdWithDetails(buildingId);
        }

        return readings
                .stream()
                .map(this::toResponseWithPreviousReading)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UtilityReadingOverviewResponse getOverview(Long buildingId, String month) {
        validateBuildingExists(buildingId);
        LocalDate readingMonth = parseMonth(month);
        List<Room> rooms = roomRepository.findByFilters(buildingId, null, null);
        Set<Long> activeRoomIds = roomAssignmentRepository
                .findByBuildingIdAndStatusWithDetails(buildingId, RoomAssignmentStatus.ACTIVE)
                .stream()
                .map(assignment -> assignment.getRoom().getId())
                .collect(Collectors.toSet());
        Set<Long> recordedRoomIds = Set.copyOf(
                utilityReadingRepository.findRoomIdsByBuildingIdAndMonth(buildingId, readingMonth)
        );

        List<RoomResponse> eligibleRooms = rooms.stream()
                .filter(room -> room.getStatus() == RoomStatus.OCCUPIED)
                .filter(room -> activeRoomIds.contains(room.getId()))
                .filter(room -> !recordedRoomIds.contains(room.getId()))
                .sorted(Comparator.comparing(Room::getRoomCode))
                .map(roomMapper::toResponse)
                .toList();

        long emptyRooms = rooms.stream()
                .filter(room -> room.getStatus() == RoomStatus.EMPTY)
                .count();

        return UtilityReadingOverviewResponse.builder()
                .month(readingMonth.toString().substring(0, 7))
                .totalRooms(rooms.size())
                .recordedRooms(recordedRoomIds.size())
                .pendingRooms(eligibleRooms.size())
                .emptyRooms(emptyRooms)
                .eligibleRooms(eligibleRooms)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UtilityReadingResponse getReading(Long id) {
        return toResponseWithPreviousReading(findReading(id));
    }

    @Override
    @Transactional
    public UtilityReadingResponse updateReading(Long id, UtilityReadingUpdateRequest request) {
        UtilityReading reading = findReading(id);
        Room room = findRoom(request.getRoomId());
        validateReadingBelongsToBuilding(reading, request.getBuildingId());
        validateRoomBelongsToBuilding(room, request.getBuildingId());
        validateRoomCanReceiveUtilityReading(room);
        LocalDate readingDate = parseReadingDate(request.getReadingDate(), request.getMonth());
        LocalDate month = readingDate.withDayOfMonth(1);

        validateReadings(
                request.getOldElectricity(),
                request.getNewElectricity(),
                request.getOldWater(),
                request.getNewWater()
        );

        if (utilityReadingRepository.existsByRoom_IdAndMonthAndIdNot(room.getId(), month, id)) {
            throw new BadRequestException("Utility reading already exists for this room and month");
        }

        reading.setRoom(room);
        reading.setMonth(month);
        reading.setReadingDate(readingDate);
        reading.setOldElectricity(request.getOldElectricity());
        reading.setNewElectricity(request.getNewElectricity());
        reading.setOldWater(request.getOldWater());
        reading.setNewWater(request.getNewWater());
        reading.setEditReason(request.getEditReason().trim());

        if (request.getElectricityImage() != null && !request.getElectricityImage().isEmpty()) {
            reading.setElectricityImageUrl(imageStorageService.store(
                    request.getElectricityImage(),
                    "Electricity evidence image"
            ));
        }

        if (request.getWaterImage() != null && !request.getWaterImage().isEmpty()) {
            reading.setWaterImageUrl(imageStorageService.store(request.getWaterImage(), "Water evidence image"));
        }

        return toResponseWithPreviousReading(utilityReadingRepository.save(reading));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UtilityReadingResponse> getCurrentResidentRoomReadings(Long residentHeadId) {
        RoomAssignment assignment = roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Head Resident must have an active room"));

        return utilityReadingRepository.findByRoomIdWithDetails(assignment.getRoom().getId())
                .stream()
                .map(this::toResponseWithPreviousReading)
                .toList();
    }

    private UtilityReadingResponse toResponseWithPreviousReading(UtilityReading reading) {
        UtilityReading previousReading = utilityReadingRepository
                .findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(
                        reading.getRoom().getId(),
                        reading.getMonth()
                )
                .orElse(null);

        return utilityReadingMapper.toResponse(reading, previousReading);
    }

    private UtilityReading findReading(Long id) {
        return utilityReadingRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utility reading not found"));
    }

    private Room findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validateRoomBelongsToBuilding(Room room, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!room.getBuilding().getId().equals(buildingId)) {
            throw new BadRequestException("Selected room does not belong to the selected building");
        }
    }

    private void validateReadingBelongsToBuilding(UtilityReading reading, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!reading.getRoom().getBuilding().getId().equals(buildingId)) {
            throw new BadRequestException("Utility reading does not belong to the selected building");
        }
    }

    private void validateRoomCanReceiveUtilityReading(Room room) {
        if (room.getStatus() != RoomStatus.OCCUPIED) {
            throw new BadRequestException("Only occupied rooms can receive utility readings");
        }

        if (!roomAssignmentRepository.existsByRoom_IdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE)) {
            throw new BadRequestException("Only rooms with an active Head Resident can receive utility readings");
        }
    }

    private LocalDate parseMonth(String month) {
        if (month == null || month.isBlank()) {
            throw new BadRequestException("Reading date is required");
        }

        try {
            return YearMonth.parse(month.trim()).atDay(1);
        } catch (RuntimeException exception) {
            throw new BadRequestException("Reading month must use YYYY-MM format");
        }
    }

    private LocalDate parseReadingDate(String readingDate, String fallbackMonth) {
        if (readingDate == null || readingDate.isBlank()) {
            return parseMonth(fallbackMonth);
        }

        try {
            return LocalDate.parse(readingDate.trim());
        } catch (RuntimeException exception) {
            throw new BadRequestException("Reading date must use YYYY-MM-DD format");
        }
    }

    private void validateReadings(
            BigDecimal oldElectricity,
            BigDecimal newElectricity,
            BigDecimal oldWater,
            BigDecimal newWater
    ) {
        if (newElectricity.compareTo(oldElectricity) < 0) {
            throw new BadRequestException("New electricity reading must be greater than or equal to old electricity reading");
        }

        if (newWater.compareTo(oldWater) < 0) {
            throw new BadRequestException("New water reading must be greater than or equal to old water reading");
        }
    }
}
