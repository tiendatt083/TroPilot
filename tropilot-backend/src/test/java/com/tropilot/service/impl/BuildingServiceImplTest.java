package com.tropilot.service.impl;

import com.tropilot.dto.request.BuildingUpsertRequest;
import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.enums.RoomStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.mapper.BuildingMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.validation.RoomReferenceChecker;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuildingServiceImplTest {

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BuildingMapper buildingMapper;

    @Mock
    private RoomReferenceChecker roomReferenceChecker;

    @InjectMocks
    private BuildingServiceImpl service;

    @Test
    void updateBuildingCodeUpdatesRoomCodePrefixes() {
        Building building = BusinessRuleTestFixtures.building();
        Room room101 = BusinessRuleTestFixtures.room(RoomStatus.EMPTY);
        Room room102 = BusinessRuleTestFixtures.room(RoomStatus.EMPTY);
        room102.setId(11L);
        room102.setRoomCode("BD01-P102");
        BuildingUpsertRequest request = request("GPD");

        prepareUpdate(building, request, List.of(room101, room102));

        service.updateBuilding(building.getId(), request);

        assertThat(building.getBuildingCode()).isEqualTo("GPD");
        assertThat(room101.getRoomCode()).isEqualTo("GPD-P101");
        assertThat(room102.getRoomCode()).isEqualTo("GPD-P102");
        verify(roomRepository).saveAllAndFlush(List.of(room101, room102));
    }

    @Test
    void updateBuildingRepairsStaleRoomPrefixEvenWhenBuildingCodeDoesNotChange() {
        Building building = BusinessRuleTestFixtures.building();
        building.setBuildingCode("GPD");
        Room room = BusinessRuleTestFixtures.room(RoomStatus.EMPTY);
        room.setBuilding(building);
        room.setRoomCode("BD01-P101");
        BuildingUpsertRequest request = request("GPD");

        prepareUpdate(building, request, List.of(room));

        service.updateBuilding(building.getId(), request);

        assertThat(room.getRoomCode()).isEqualTo("GPD-P101");
        verify(roomRepository).saveAllAndFlush(List.of(room));
    }

    @Test
    void updateBuildingRejectsRoomCodeConflict() {
        Building building = BusinessRuleTestFixtures.building();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.EMPTY);
        Room conflictingRoom = BusinessRuleTestFixtures.room(RoomStatus.EMPTY);
        conflictingRoom.setId(99L);
        conflictingRoom.setRoomCode("GPD-P101");
        BuildingUpsertRequest request = request("GPD");

        when(buildingRepository.findById(building.getId())).thenReturn(Optional.of(building));
        when(buildingRepository.findByBuildingCode("GPD")).thenReturn(Optional.empty());
        when(roomRepository.findAllByBuilding_IdOrderByRoomCodeAsc(building.getId())).thenReturn(List.of(room));
        when(roomRepository.findByRoomCode("GPD-P101")).thenReturn(Optional.of(conflictingRoom));

        assertThatThrownBy(() -> service.updateBuilding(building.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("duplicate room code GPD-P101");

        assertThat(building.getBuildingCode()).isEqualTo("BD01");
        verify(roomRepository, never()).saveAllAndFlush(any());
        verify(buildingRepository, never()).save(any());
    }

    private void prepareUpdate(Building building, BuildingUpsertRequest request, List<Room> rooms) {
        when(buildingRepository.findById(building.getId())).thenReturn(Optional.of(building));
        when(buildingRepository.findByBuildingCode(request.getBuildingCode())).thenReturn(Optional.empty());
        when(roomRepository.findAllByBuilding_IdOrderByRoomCodeAsc(building.getId())).thenReturn(rooms);
        for (Room room : rooms) {
            String localCode = room.getRoomCode().substring(room.getRoomCode().indexOf("-") + 1);
            when(roomRepository.findByRoomCode(request.getBuildingCode() + "-" + localCode))
                    .thenReturn(Optional.empty());
        }
        when(buildingRepository.save(building)).thenReturn(building);
        when(buildingMapper.toResponse(building)).thenReturn(BuildingResponse.builder()
                .id(building.getId())
                .buildingCode(request.getBuildingCode())
                .build());
    }

    private BuildingUpsertRequest request(String buildingCode) {
        BuildingUpsertRequest request = new BuildingUpsertRequest();
        request.setBuildingCode(buildingCode);
        request.setName("Building 01");
        request.setAddress("Demo address");
        request.setFloors(5);
        return request;
    }
}
