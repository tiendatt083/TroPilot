package com.tropilot.service.impl;

import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomMember;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoomMemberMapper {

    private final RoomMemberRepository roomMemberRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;

    public RoomMemberResponse toResponse(RoomMember member) {
        Room room = member.getRoom();
        Building building = room.getBuilding();
        User residentHead = member.getResidentHead();
        int approvedMemberCount = Math.toIntExact(roomMemberRepository.countByRoom_IdAndStatus(
                room.getId(),
                RoomMemberStatus.APPROVED
        ));
        int headResidentOccupantCount = roomAssignmentRepository
                .existsByRoom_IdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE) ? 1 : 0;

        return RoomMemberResponse.builder()
                .id(member.getId())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .fullName(member.getFullName())
                .phone(member.getPhone())
                .identityNumber(member.getIdentityNumber())
                .dateOfBirth(member.getDateOfBirth())
                .relationship(member.getRelationship())
                .moveInDate(member.getMoveInDate())
                .moveOutDate(member.getMoveOutDate())
                .status(member.getStatus())
                .note(member.getNote())
                .headResidentOccupantCount(headResidentOccupantCount)
                .approvedMemberCount(approvedMemberCount)
                .totalOccupants(headResidentOccupantCount + approvedMemberCount)
                .maxOccupants(room.getMaxOccupants())
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }
}
