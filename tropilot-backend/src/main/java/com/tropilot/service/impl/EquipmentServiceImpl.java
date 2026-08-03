package com.tropilot.service.impl;

import com.tropilot.dto.request.EquipmentUpsertRequest;
import com.tropilot.dto.response.EquipmentDeleteResponse;
import com.tropilot.dto.response.EquipmentMaintenanceHistoryResponse;
import com.tropilot.dto.response.EquipmentResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Equipment;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.enums.EquipmentCondition;
import com.tropilot.enums.EquipmentScope;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.mapper.EquipmentMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.EquipmentMaintenanceHistoryRepository;
import com.tropilot.repository.EquipmentRepository;
import com.tropilot.repository.MaintenanceRequestRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
/** Quản lý thiết bị: tạo mã, gán vị trí, kiểm tra lịch bảo trì và trả lịch sử bảo trì. */
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentMaintenanceHistoryRepository equipmentMaintenanceHistoryRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final EquipmentMapper equipmentMapper;

    @Override
    @Transactional
    /** Tạo thiết bị cho tòa nhà, sinh/kiểm tra mã và xác định phòng đặt thiết bị theo phạm vi sử dụng. */
    public EquipmentResponse createEquipment(Long buildingId, EquipmentUpsertRequest request) {
        Building building = findBuilding(buildingId);
        Equipment equipment = Equipment.builder()
                .building(building)
                .build();
        applyValues(equipment, request);

        return equipmentMapper.toResponse(equipmentRepository.save(equipment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> getAdminEquipment(
            Long buildingId,
            String scope,
            Long roomId,
            String condition
    ) {
        if (buildingId != null) {
            findBuilding(buildingId);
        }

        return filterEquipment(
                equipmentRepository.findAllWithBuildingAndRoom(),
                buildingId,
                scope,
                roomId,
                condition
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> getAdminBuildingEquipment(
            Long buildingId,
            String scope,
            Long roomId,
            String condition
    ) {
        findBuilding(buildingId);
        return filterEquipment(
                equipmentRepository.findByBuilding_IdOrderByScopeAscNameAsc(buildingId),
                null,
                scope,
                roomId,
                condition
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> getStaffBuildingEquipment(
            Long buildingId,
            String scope,
            Long roomId,
            String condition
    ) {
        findBuilding(buildingId);
        return filterEquipment(
                equipmentRepository.findByBuilding_IdAndConditionNotOrderByScopeAscNameAsc(
                        buildingId,
                        EquipmentCondition.INACTIVE
                ),
                null,
                scope,
                roomId,
                condition
        );
    }

    @Override
    @Transactional(readOnly = true)
    /** Lấy thiết bị mà chủ hộ có thể xem trong phòng hoặc tòa nhà đang được phân. */
    public List<EquipmentResponse> getResidentEquipment(Long residentHeadId) {
        RoomAssignment assignment = roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Head Resident must have an active room"));

        Long buildingId = assignment.getRoom().getBuilding().getId();
        Long roomId = assignment.getRoom().getId();

        return equipmentRepository
                .findByBuilding_IdAndConditionNotOrderByScopeAscNameAsc(
                        buildingId,
                        EquipmentCondition.INACTIVE
                )
                .stream()
                .filter(equipment -> equipment.getScope() == EquipmentScope.ROOM
                        && equipment.getRoom() != null
                        && Objects.equals(equipment.getRoom().getId(), roomId))
                .map(equipmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    /** Tìm chi tiết thiết bị theo id. */
    public EquipmentResponse getEquipment(Long id) {
        return equipmentMapper.toResponse(findEquipment(id));
    }

    @Override
    @Transactional
    /** Cập nhật thiết bị trong đúng tòa nhà, bao gồm mã, vị trí, tình trạng và lịch bảo trì. */
    public EquipmentResponse updateEquipment(Long buildingId, Long id, EquipmentUpsertRequest request) {
        Equipment equipment = findBuildingEquipment(buildingId, id);
        applyValues(equipment, request);
        return equipmentMapper.toResponse(equipmentRepository.save(equipment));
    }

    @Override
    @Transactional
    /** Xóa thiết bị nếu không còn dữ liệu bảo trì phụ thuộc cần được bảo toàn. */
    public EquipmentDeleteResponse deleteEquipment(Long buildingId, Long id) {
        Equipment equipment = findBuildingEquipment(buildingId, id);

        if (maintenanceRequestRepository.existsByEquipment_Id(id)) {
            equipment.setCondition(EquipmentCondition.INACTIVE);
            equipmentRepository.save(equipment);

            return EquipmentDeleteResponse.builder()
                    .id(id)
                    .deleted(false)
                    .deactivated(true)
                    .build();
        }

        equipmentRepository.delete(equipment);
        return EquipmentDeleteResponse.builder()
                .id(id)
                .deleted(true)
                .deactivated(false)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    /** Lấy lịch sử các lần bảo trì của một thiết bị, mới nhất trước. */
    public List<EquipmentMaintenanceHistoryResponse> getMaintenanceHistory(Long equipmentId) {
        findEquipment(equipmentId);
        return equipmentMaintenanceHistoryRepository
                .findByEquipment_IdOrderByMaintenanceDateDescCreatedAtDesc(equipmentId)
                .stream()
                .map(equipmentMapper::toHistoryResponse)
                .toList();
    }

    private List<EquipmentResponse> filterEquipment(
            List<Equipment> equipmentList,
            Long buildingId,
            String scopeValue,
            Long roomId,
            String conditionValue
    ) {
        EquipmentScope scope = parseOptionalScope(scopeValue);
        EquipmentCondition condition = parseOptionalCondition(conditionValue);

        return equipmentList.stream()
                .filter(equipment -> buildingId == null || Objects.equals(equipment.getBuilding().getId(), buildingId))
                .filter(equipment -> scope == null || equipment.getScope() == scope)
                .filter(equipment -> roomId == null
                        || (equipment.getRoom() != null && Objects.equals(equipment.getRoom().getId(), roomId)))
                .filter(equipment -> condition == null || equipment.getCondition() == condition)
                .map(equipmentMapper::toResponse)
                .toList();
    }

    private void applyValues(Equipment equipment, EquipmentUpsertRequest request) {
        EquipmentScope scope = parseScope(request.getScope());
        EquipmentCondition condition = parseCondition(request.getCondition());
        Room room = resolveRoom(equipment.getBuilding(), scope, request.getRoomId());
        String equipmentCode = resolveEquipmentCode(equipment, request.getEquipmentCode(), scope, room);

        validateMaintenanceDates(request.getLastMaintenanceDate(), request.getNextMaintenanceDate());
        validateEquipmentCodeAvailability(equipment.getBuilding().getId(), equipmentCode, equipment.getId());

        equipment.setRoom(room);
        equipment.setEquipmentCode(equipmentCode);
        equipment.setName(request.getName().trim());
        equipment.setScope(scope);
        equipment.setQuantity(request.getQuantity());
        equipment.setBrand(normalizeOptionalText(request.getBrand()));
        equipment.setModel(normalizeOptionalText(request.getModel()));
        equipment.setLocationDescription(normalizeOptionalText(request.getLocationDescription()));
        equipment.setAddedDate(request.getAddedDate() == null ? LocalDate.now() : request.getAddedDate());
        equipment.setInstallationDate(request.getInstallationDate());
        equipment.setLastMaintenanceDate(request.getLastMaintenanceDate());
        equipment.setNextMaintenanceDate(request.getNextMaintenanceDate());
        equipment.setCondition(condition);
        equipment.setNote(normalizeOptionalText(request.getNote()));
    }

    private Room resolveRoom(Building building, EquipmentScope scope, Long roomId) {
        if (scope == EquipmentScope.BUILDING) {
            if (roomId != null) {
                throw new BadRequestException("Building equipment must not be assigned to a room");
            }
            return null;
        }

        if (roomId == null) {
            throw new BadRequestException("Room equipment requires a room");
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        if (!Objects.equals(room.getBuilding().getId(), building.getId())) {
            throw new BadRequestException("Equipment room must belong to the selected building");
        }
        return room;
    }

    private void validateMaintenanceDates(LocalDate lastMaintenanceDate, LocalDate nextMaintenanceDate) {
        if (lastMaintenanceDate != null
                && nextMaintenanceDate != null
                && nextMaintenanceDate.isBefore(lastMaintenanceDate)) {
            throw new BadRequestException("Next maintenance date must not be before the last maintenance date");
        }
    }

    private String resolveEquipmentCode(
            Equipment equipment,
            String requestedCode,
            EquipmentScope scope,
            Room room
    ) {
        if (requestedCode != null && !requestedCode.isBlank()) {
            return normalizeCode(requestedCode);
        }

        if (equipment.getId() != null && equipment.getEquipmentCode() != null) {
            return equipment.getEquipmentCode();
        }

        String prefix = scope == EquipmentScope.ROOM
                ? room.getRoomCode() + "-EQ"
                : equipment.getBuilding().getBuildingCode() + "-EQ";
        return generateEquipmentCode(equipment.getBuilding().getId(), normalizeCode(prefix));
    }

    private String generateEquipmentCode(Long buildingId, String prefix) {
        long existingCount = equipmentRepository.countByBuilding_IdAndEquipmentCodeStartingWith(
                buildingId,
                prefix + "-"
        );
        long sequence = existingCount + 1;

        while (true) {
            String candidate = "%s-%03d".formatted(prefix, sequence);
            if (!equipmentRepository.existsByBuilding_IdAndEquipmentCode(buildingId, candidate)) {
                return candidate;
            }
            sequence++;
        }
    }

    private void validateEquipmentCodeAvailability(Long buildingId, String equipmentCode, Long currentEquipmentId) {
        equipmentRepository.findByBuilding_IdAndEquipmentCode(buildingId, equipmentCode)
                .filter(existing -> !Objects.equals(existing.getId(), currentEquipmentId))
                .ifPresent(existing -> {
                    throw new BadRequestException("Equipment code is already in use in this building");
                });
    }

    private Equipment findBuildingEquipment(Long buildingId, Long id) {
        findBuilding(buildingId);
        Equipment equipment = findEquipment(id);
        if (!Objects.equals(equipment.getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Equipment does not belong to the selected building");
        }
        return equipment;
    }

    private Equipment findEquipment(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));
    }

    private Building findBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found"));
    }

    private EquipmentScope parseScope(String value) {
        try {
            return EquipmentScope.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Equipment scope is invalid");
        }
    }

    private EquipmentScope parseOptionalScope(String value) {
        return value == null || value.isBlank() ? null : parseScope(value);
    }

    private EquipmentCondition parseCondition(String value) {
        try {
            return EquipmentCondition.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Equipment condition is invalid");
        }
    }

    private EquipmentCondition parseOptionalCondition(String value) {
        return value == null || value.isBlank() ? null : parseCondition(value);
    }

    private String normalizeCode(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
