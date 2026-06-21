package com.tropilot.service.impl;

import com.tropilot.dto.response.EquipmentResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Equipment;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.EquipmentCondition;
import com.tropilot.enums.EquipmentScope;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.mapper.EquipmentMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.EquipmentMaintenanceHistoryRepository;
import com.tropilot.repository.EquipmentRepository;
import com.tropilot.repository.MaintenanceRequestRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceImplTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private EquipmentMaintenanceHistoryRepository equipmentMaintenanceHistoryRepository;

    @Mock
    private MaintenanceRequestRepository maintenanceRequestRepository;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @Spy
    private EquipmentMapper equipmentMapper = new EquipmentMapper();

    @InjectMocks
    private EquipmentServiceImpl service;

    @Test
    void residentEquipmentOnlyIncludesEquipmentAssignedToCurrentRoom() {
        Building building = BusinessRuleTestFixtures.building();
        Room currentRoom = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        Room otherRoom = Room.builder()
                .id(11L)
                .building(building)
                .roomCode("BD01-P102")
                .roomName("Room 102")
                .floor(1)
                .price(new BigDecimal("5000000"))
                .area(new BigDecimal("30"))
                .maxOccupants(3)
                .status(RoomStatus.OCCUPIED)
                .build();
        User residentHead = BusinessRuleTestFixtures.residentHead();
        RoomAssignment assignment = BusinessRuleTestFixtures.activeAssignment(currentRoom, residentHead);

        Equipment sharedEquipment = equipment(1L, building, null, EquipmentScope.BUILDING, "BD01-EQ-001");
        Equipment currentRoomEquipment = equipment(2L, building, currentRoom, EquipmentScope.ROOM, "BD01-P101-EQ-001");
        Equipment otherRoomEquipment = equipment(3L, building, otherRoom, EquipmentScope.ROOM, "BD01-P102-EQ-001");

        when(roomAssignmentRepository.findByResidentHeadIdAndStatus(
                residentHead.getId(),
                RoomAssignmentStatus.ACTIVE
        )).thenReturn(Optional.of(assignment));
        when(equipmentRepository.findByBuilding_IdAndConditionNotOrderByScopeAscNameAsc(
                building.getId(),
                EquipmentCondition.INACTIVE
        )).thenReturn(List.of(sharedEquipment, currentRoomEquipment, otherRoomEquipment));

        List<EquipmentResponse> response = service.getResidentEquipment(residentHead.getId());

        assertThat(response)
                .extracting(EquipmentResponse::getId)
                .containsExactly(currentRoomEquipment.getId());
        assertThat(response.get(0).getScope()).isEqualTo(EquipmentScope.ROOM);
        assertThat(response.get(0).getRoomId()).isEqualTo(currentRoom.getId());
    }

    private Equipment equipment(Long id, Building building, Room room, EquipmentScope scope, String code) {
        return Equipment.builder()
                .id(id)
                .building(building)
                .room(room)
                .equipmentCode(code)
                .name("Equipment " + id)
                .scope(scope)
                .quantity(1)
                .addedDate(LocalDate.of(2026, 6, 1))
                .installationDate(LocalDate.of(2026, 6, 1))
                .condition(EquipmentCondition.GOOD)
                .build();
    }
}
