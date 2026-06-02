package com.tropilot.service.impl;

import com.tropilot.dto.response.BuildingUserResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.RoomMember;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.service.BuildingUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class BuildingUserServiceImpl implements BuildingUserService {

    private static final String ACCOUNT_RECORD_TYPE = "USER_ACCOUNT";
    private static final String ROOM_MEMBER_RECORD_TYPE = "ROOM_MEMBER";

    private final BuildingRepository buildingRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RoomMemberRepository roomMemberRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BuildingUserResponse> getBuildingUsers(Long buildingId) {
        validateBuildingExists(buildingId);

        List<BuildingUserResponse> residentHeads = roomAssignmentRepository
                .findByBuildingIdAndStatusWithDetails(buildingId, RoomAssignmentStatus.ACTIVE)
                .stream()
                .map(this::mapResidentHead)
                .toList();

        List<BuildingUserResponse> roomMembers = roomMemberRepository
                .findByBuildingIdAndStatusWithDetails(buildingId, RoomMemberStatus.APPROVED)
                .stream()
                .map(this::mapRoomMember)
                .toList();

        return Stream.concat(residentHeads.stream(), roomMembers.stream())
                .sorted(buildingUserComparator())
                .toList();
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private BuildingUserResponse mapResidentHead(RoomAssignment assignment) {
        User user = assignment.getResidentHead();
        Room room = assignment.getRoom();
        Building building = room.getBuilding();

        return BuildingUserResponse.builder()
                .id(user.getId())
                .recordType(ACCOUNT_RECORD_TYPE)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .identityNumber(user.getIdentityNumber())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .relationship("Head Resident")
                .moveInDate(assignment.getStartDate())
                .moveOutDate(assignment.getEndDate())
                .build();
    }

    private BuildingUserResponse mapRoomMember(RoomMember member) {
        Room room = member.getRoom();
        Building building = room.getBuilding();

        return BuildingUserResponse.builder()
                .id(member.getId())
                .recordType(ROOM_MEMBER_RECORD_TYPE)
                .fullName(member.getFullName())
                .email(member.getEmail())
                .phone(member.getPhone())
                .identityNumber(member.getIdentityNumber())
                .role(ROOM_MEMBER_RECORD_TYPE)
                .status(member.getStatus().name())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .relationship(member.getRelationship())
                .moveInDate(member.getMoveInDate())
                .moveOutDate(member.getMoveOutDate())
                .build();
    }

    private Comparator<BuildingUserResponse> buildingUserComparator() {
        return Comparator
                .comparing(BuildingUserResponse::getRoomCode, Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(user -> user.getRecordType().equals(ACCOUNT_RECORD_TYPE) ? 0 : 1)
                .thenComparing(BuildingUserResponse::getFullName, Comparator.nullsLast(String::compareToIgnoreCase));
    }
}
