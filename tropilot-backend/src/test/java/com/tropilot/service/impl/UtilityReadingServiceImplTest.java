package com.tropilot.service.impl;

import com.tropilot.dto.request.UtilityReadingCreateRequest;
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
import com.tropilot.mapper.RoomMapper;
import com.tropilot.mapper.UtilityReadingMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.repository.UtilityReadingRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.storage.UtilityReadingImageStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
/** Kiểm tra nhập chỉ số điện nước cho phòng hợp lệ, chặn trùng tháng và tạo số liệu tổng quan. */
class UtilityReadingServiceImplTest {

    @Mock
    private UtilityReadingRepository utilityReadingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @Mock
    private RoomMapper roomMapper;

    @Mock
    private UtilityReadingMapper utilityReadingMapper;

    @Mock
    private UtilityReadingImageStorageService imageStorageService;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private UtilityReadingServiceImpl service;

    @Test
    void residentOnlySeesReadingsRecordedAfterTheirAssignmentStarted() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        User residentB = BusinessRuleTestFixtures.residentHead();
        RoomAssignment assignment = BusinessRuleTestFixtures.activeAssignment(room, residentB);
        assignment.setStartDate(LocalDate.of(2026, 8, 1));

        UtilityReading readingFromPreviousResident = UtilityReading.builder()
                .id(801L)
                .room(room)
                .month(LocalDate.of(2026, 7, 1))
                .readingDate(LocalDate.of(2026, 7, 31))
                .createdBy(BusinessRuleTestFixtures.admin())
                .build();
        UtilityReading readingForResidentB = UtilityReading.builder()
                .id(802L)
                .room(room)
                .month(LocalDate.of(2026, 8, 1))
                .readingDate(LocalDate.of(2026, 8, 31))
                .createdBy(BusinessRuleTestFixtures.admin())
                .build();
        UtilityReadingResponse expected = UtilityReadingResponse.builder().id(802L).build();

        when(roomAssignmentRepository.findByResidentHeadIdAndStatus(
                residentB.getId(),
                RoomAssignmentStatus.ACTIVE
        )).thenReturn(Optional.of(assignment));
        when(utilityReadingRepository.findByRoomIdWithDetails(room.getId()))
                .thenReturn(List.of(readingFromPreviousResident, readingForResidentB));
        when(utilityReadingRepository.findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(
                room.getId(),
                LocalDate.of(2026, 8, 1)
        )).thenReturn(Optional.of(readingFromPreviousResident));
        when(utilityReadingMapper.toResponse(readingForResidentB, readingFromPreviousResident)).thenReturn(expected);

        assertThat(service.getCurrentResidentRoomReadings(residentB.getId()))
                .extracting(UtilityReadingResponse::getId)
                .containsExactly(802L);

        // The July reading remains available to staff for meter carry-forward, not to B.
        verify(utilityReadingMapper, never()).toResponse(readingFromPreviousResident, null);
    }

    @Test
    void createReadingRejectsEmptyRoom() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.EMPTY);
        UtilityReadingCreateRequest request = readingRequest(room.getId(), "2026-06-03");
        when(roomRepository.findById(room.getId())).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> service.createReading(request, BusinessRuleTestFixtures.ADMIN_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("occupied rooms");

        verify(utilityReadingRepository, never()).save(any());
        verify(userRepository, never()).findById(any());
    }

    @Test
    void createReadingRejectsDuplicateRoomMonth() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        User admin = BusinessRuleTestFixtures.admin();
        UtilityReadingCreateRequest request = readingRequest(room.getId(), "2026-06-03");

        when(roomRepository.findById(room.getId())).thenReturn(Optional.of(room));
        when(roomAssignmentRepository.existsByRoom_IdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(true);
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(utilityReadingRepository.existsByRoom_IdAndMonth(room.getId(), LocalDate.of(2026, 6, 1)))
                .thenReturn(true);

        assertThatThrownBy(() -> service.createReading(request, admin.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");

        verify(utilityReadingRepository, never()).save(any());
        verify(imageStorageService, never()).store(any(), any());
    }

    @Test
    void createReadingSavesValidReadingForOccupiedRoom() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        User admin = BusinessRuleTestFixtures.admin();
        UtilityReadingCreateRequest request = readingRequest(room.getId(), "2026-06-03");
        UtilityReadingResponse mappedResponse = UtilityReadingResponse.builder()
                .id(800L)
                .roomId(room.getId())
                .month("2026-06")
                .readingDate("2026-06-03")
                .build();

        when(roomRepository.findById(room.getId())).thenReturn(Optional.of(room));
        when(roomAssignmentRepository.existsByRoom_IdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(true);
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(utilityReadingRepository.existsByRoom_IdAndMonth(room.getId(), LocalDate.of(2026, 6, 1)))
                .thenReturn(false);
        when(utilityReadingRepository.save(any(UtilityReading.class))).thenAnswer(invocation -> {
            UtilityReading reading = invocation.getArgument(0);
            reading.setId(800L);
            return reading;
        });
        when(utilityReadingRepository.findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(
                room.getId(),
                LocalDate.of(2026, 6, 1)
        )).thenReturn(Optional.empty());
        when(utilityReadingMapper.toResponse(any(UtilityReading.class), isNull())).thenReturn(mappedResponse);

        UtilityReadingResponse response = service.createReading(request, admin.getId());

        assertThat(response.getId()).isEqualTo(800L);
        ArgumentCaptor<UtilityReading> readingCaptor = ArgumentCaptor.forClass(UtilityReading.class);
        verify(utilityReadingRepository).save(readingCaptor.capture());
        UtilityReading savedReading = readingCaptor.getValue();
        assertThat(savedReading.getMonth()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(savedReading.getReadingDate()).isEqualTo(LocalDate.of(2026, 6, 3));
        assertThat(savedReading.getNewElectricity()).isEqualByComparingTo("120");
        assertThat(savedReading.getNewWater()).isEqualByComparingTo("12");
        assertThat(savedReading.getElectricityImageUrl()).isNull();
        assertThat(savedReading.getWaterImageUrl()).isNull();
        verify(imageStorageService, never()).store(any(), any());
    }

    @Test
    void getOverviewOnlyReturnsOccupiedActiveRoomsWithoutCurrentMonthReading() {
        Room eligibleRoom = room(10L, "BD01-P101", RoomStatus.OCCUPIED);
        Room recordedRoom = room(11L, "BD01-P102", RoomStatus.OCCUPIED);
        Room emptyRoom = room(12L, "BD01-P103", RoomStatus.EMPTY);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        RoomAssignment eligibleAssignment = BusinessRuleTestFixtures.activeAssignment(eligibleRoom, residentHead);
        RoomAssignment recordedAssignment = BusinessRuleTestFixtures.activeAssignment(recordedRoom, residentHead);
        RoomResponse eligibleResponse = RoomResponse.builder()
                .id(eligibleRoom.getId())
                .roomCode(eligibleRoom.getRoomCode())
                .status(RoomStatus.OCCUPIED)
                .build();

        when(buildingRepository.existsById(BusinessRuleTestFixtures.BUILDING_ID)).thenReturn(true);
        when(roomRepository.findByFilters(BusinessRuleTestFixtures.BUILDING_ID, null, null))
                .thenReturn(List.of(recordedRoom, emptyRoom, eligibleRoom));
        when(roomAssignmentRepository.findByBuildingIdAndStatusWithDetails(
                BusinessRuleTestFixtures.BUILDING_ID,
                RoomAssignmentStatus.ACTIVE
        )).thenReturn(List.of(eligibleAssignment, recordedAssignment));
        when(utilityReadingRepository.findRoomIdsByBuildingIdAndMonth(
                BusinessRuleTestFixtures.BUILDING_ID,
                LocalDate.of(2026, 6, 1)
        )).thenReturn(List.of(recordedRoom.getId()));
        when(roomMapper.toResponse(eligibleRoom)).thenReturn(eligibleResponse);

        UtilityReadingOverviewResponse response = service.getOverview(
                BusinessRuleTestFixtures.BUILDING_ID,
                "2026-06"
        );

        assertThat(response.getTotalRooms()).isEqualTo(3);
        assertThat(response.getRecordedRooms()).isEqualTo(1);
        assertThat(response.getPendingRooms()).isEqualTo(1);
        assertThat(response.getEmptyRooms()).isEqualTo(1);
        assertThat(response.getEligibleRooms())
                .extracting(RoomResponse::getId)
                .containsExactly(eligibleRoom.getId());
    }

    private UtilityReadingCreateRequest readingRequest(Long roomId, String readingDate) {
        UtilityReadingCreateRequest request = new UtilityReadingCreateRequest();
        request.setRoomId(roomId);
        request.setReadingDate(readingDate);
        request.setOldElectricity(new BigDecimal("100"));
        request.setNewElectricity(new BigDecimal("120"));
        request.setOldWater(new BigDecimal("10"));
        request.setNewWater(new BigDecimal("12"));
        return request;
    }

    private Room room(Long id, String roomCode, RoomStatus status) {
        Room room = BusinessRuleTestFixtures.room(status);
        room.setId(id);
        room.setRoomCode(roomCode);
        return room;
    }
}
