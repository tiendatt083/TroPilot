package com.tropilot.mapper;

import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
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
/**
 * Chuyển thành viên phòng thành dữ liệu phản hồi và tính số người hiện đang ở phòng.
 * Mapper tra cứu phân phòng đang hiệu lực để hiển thị số chủ hộ, thành viên đã duyệt và sức chứa tối đa.
 */
public class RoomMemberMapper {

    private final RoomMemberRepository roomMemberRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;

    /**
     * Tạo RoomMemberResponse. Số người ở được tính theo phân phòng ACTIVE, không chỉ theo bản ghi thành viên đang map.
     */
    public RoomMemberResponse toResponse(RoomMember member) {
        Room room = member.getRoom();
        Building building = room.getBuilding();
        User residentHead = member.getResidentHead();
        RoomAssignment activeAssignment = roomAssignmentRepository
                .findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE)
                .orElse(null);
        int headResidentOccupantCount = activeAssignment == null ? 0 : 1;
        int approvedMemberCount = activeAssignment == null ? 0 : Math.toIntExact(
                roomMemberRepository.countByRoom_IdAndResidentHead_IdAndStatus(
                        room.getId(),
                        activeAssignment.getResidentHead().getId(),
                        RoomMemberStatus.APPROVED
                )
        );

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
                .email(member.getEmail())
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
