package com.tropilot.service.impl;

import com.tropilot.dto.request.RoomMemberRequest;
import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.RoomMember;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.RoomMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RoomMemberServiceImpl implements RoomMemberService {

    private final RoomMemberRepository roomMemberRepository;
    private final BuildingRepository buildingRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberMapper roomMemberMapper;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public RoomMemberResponse createResidentMember(Long residentHeadId, RoomMemberRequest request) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);

        RoomMember member = RoomMember.builder()
                .room(assignment.getRoom())
                .residentHead(assignment.getResidentHead())
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .email(request.getEmail().trim())
                .identityNumber(normalizeOptionalText(request.getIdentityNumber()))
                .dateOfBirth(request.getDateOfBirth())
                .relationship(normalizeOptionalText(request.getRelationship()))
                .moveInDate(resolveMoveInDate(request.getMoveInDate()))
                .status(RoomMemberStatus.PENDING)
                .note(normalizeOptionalText(request.getNote()))
                .build();

        RoomMember savedMember = roomMemberRepository.save(member);
        activityLogService.record(
                assignment.getResidentHead(),
                "ROOM_MEMBER_ADDED",
                "Added room member request for " + savedMember.getFullName()
                        + " in room " + assignment.getRoom().getRoomCode()
        );

        return roomMemberMapper.toResponse(savedMember);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getResidentMembers(Long residentHeadId) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);

        return roomMemberRepository
                .findByRoomIdAndResidentHeadIdWithDetails(assignment.getRoom().getId(), residentHeadId)
                .stream()
                .map(roomMemberMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RoomMemberResponse updateResidentMember(Long residentHeadId, Long memberId, RoomMemberRequest request) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        RoomMember member = findMember(memberId);
        validateResidentMemberOwnership(member, assignment);

        if (member.getStatus() == RoomMemberStatus.LEFT) {
            throw new BadRequestException("Left members cannot be updated");
        }

        member.setFullName(request.getFullName().trim());
        member.setPhone(request.getPhone().trim());
        member.setEmail(request.getEmail().trim());
        member.setIdentityNumber(normalizeOptionalText(request.getIdentityNumber()));
        member.setDateOfBirth(request.getDateOfBirth());
        member.setRelationship(normalizeOptionalText(request.getRelationship()));
        member.setMoveInDate(resolveMoveInDate(request.getMoveInDate()));
        member.setNote(normalizeOptionalText(request.getNote()));

        return roomMemberMapper.toResponse(roomMemberRepository.save(member));
    }

    @Override
    @Transactional
    public RoomMemberResponse markResidentMemberLeft(Long residentHeadId, Long memberId) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        RoomMember member = findMember(memberId);
        validateResidentMemberOwnership(member, assignment);

        if (member.getStatus() == RoomMemberStatus.LEFT) {
            throw new BadRequestException("Member has already left");
        }

        member.setStatus(RoomMemberStatus.LEFT);
        member.setMoveOutDate(LocalDate.now());

        return roomMemberMapper.toResponse(roomMemberRepository.save(member));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getPendingMembers(Long buildingId) {
        List<RoomMember> members = buildingId == null
                ? roomMemberRepository.findByStatusWithDetails(RoomMemberStatus.PENDING)
                : getBuildingMembersByStatus(buildingId, RoomMemberStatus.PENDING);

        return members
                .stream()
                .map(roomMemberMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getBuildingMembers(Long buildingId) {
        return getBuildingMembersInternal(buildingId)
                .stream()
                .map(roomMemberMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<RoomMemberResponse> getRoomMembers(Long roomId) {
        Room room = findRoom(roomId);
        closeOpenMembersIfRoomHasNoActiveHeadResident(room);

        return roomMemberRepository.findByRoomIdAndStatusInWithDetails(
                        roomId,
                        List.of(RoomMemberStatus.PENDING, RoomMemberStatus.APPROVED)
                )
                .stream()
                .map(roomMemberMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RoomMemberResponse approveMember(Long memberId, Long buildingId) {
        RoomMember member = findMember(memberId);
        validateMemberBelongsToBuilding(member, buildingId);

        if (member.getStatus() != RoomMemberStatus.PENDING) {
            throw new BadRequestException("Only pending members can be approved");
        }

        RoomAssignment assignment = validateActiveHeadResidentForApproval(member);
        validateRoomCapacity(member.getRoom(), assignment.getResidentHead().getId());

        member.setStatus(RoomMemberStatus.APPROVED);
        member.setMoveOutDate(null);

        RoomMember savedMember = roomMemberRepository.save(member);
        activityLogService.recordCurrentUser(
                "ROOM_MEMBER_APPROVED",
                "Approved room member " + savedMember.getFullName()
                        + " in room " + savedMember.getRoom().getRoomCode()
        );

        return roomMemberMapper.toResponse(savedMember);
    }

    @Override
    @Transactional
    public RoomMemberResponse rejectMember(Long memberId, Long buildingId) {
        RoomMember member = findMember(memberId);
        validateMemberBelongsToBuilding(member, buildingId);

        if (member.getStatus() != RoomMemberStatus.PENDING) {
            throw new BadRequestException("Only pending members can be rejected");
        }

        member.setStatus(RoomMemberStatus.REJECTED);

        RoomMember savedMember = roomMemberRepository.save(member);
        activityLogService.recordCurrentUser(
                "ROOM_MEMBER_REJECTED",
                "Rejected room member " + savedMember.getFullName()
                        + " in room " + savedMember.getRoom().getRoomCode()
        );

        return roomMemberMapper.toResponse(savedMember);
    }

    private RoomAssignment findActiveAssignment(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Head Resident must have an active room"));
    }

    private RoomMember findMember(Long memberId) {
        return roomMemberRepository.findByIdWithDetails(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Room member not found"));
    }

    private Room findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    private List<RoomMember> getBuildingMembersInternal(Long buildingId) {
        validateBuildingExists(buildingId);
        return roomMemberRepository.findByBuildingIdWithDetails(buildingId);
    }

    private List<RoomMember> getBuildingMembersByStatus(Long buildingId, RoomMemberStatus status) {
        validateBuildingExists(buildingId);
        return roomMemberRepository.findByBuildingIdAndStatusWithDetails(buildingId, status);
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validateMemberBelongsToBuilding(RoomMember member, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(member.getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Room member does not belong to the selected building");
        }
    }

    private void validateResidentMemberOwnership(RoomMember member, RoomAssignment assignment) {
        boolean sameRoom = member.getRoom().getId().equals(assignment.getRoom().getId());
        boolean sameResidentHead = member.getResidentHead().getId().equals(assignment.getResidentHead().getId());

        if (!sameRoom || !sameResidentHead) {
            throw new ForbiddenException("Room member does not belong to the current Head Resident room");
        }
    }

    private RoomAssignment validateActiveHeadResidentForApproval(RoomMember member) {
        RoomAssignment assignment = roomAssignmentRepository
                .findByRoomIdAndStatus(member.getRoom().getId(), RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Room does not have an active Head Resident"));

        if (!assignment.getResidentHead().getId().equals(member.getResidentHead().getId())) {
            throw new BadRequestException("Room member does not belong to the active Head Resident");
        }

        return assignment;
    }

    private void validateRoomCapacity(Room room, Long residentHeadId) {
        int approvedMemberCount = Math.toIntExact(roomMemberRepository.countByRoom_IdAndResidentHead_IdAndStatus(
                room.getId(),
                residentHeadId,
                RoomMemberStatus.APPROVED
        ));
        int totalAfterApproval = 1 + approvedMemberCount + 1;

        if (totalAfterApproval > room.getMaxOccupants()) {
            throw new BadRequestException("Room maximum occupants would be exceeded");
        }
    }

    private LocalDate resolveMoveInDate(LocalDate moveInDate) {
        return moveInDate == null ? LocalDate.now() : moveInDate;
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private void closeOpenMembersIfRoomHasNoActiveHeadResident(Room room) {
        boolean hasActiveHeadResident = roomAssignmentRepository.existsByRoom_IdAndStatus(
                room.getId(),
                RoomAssignmentStatus.ACTIVE
        );

        if (hasActiveHeadResident) {
            return;
        }

        List<RoomMember> openMembers = roomMemberRepository.findByRoom_IdAndStatusIn(
                room.getId(),
                List.of(RoomMemberStatus.PENDING, RoomMemberStatus.APPROVED)
        );

        if (openMembers.isEmpty()) {
            return;
        }

        LocalDate moveOutDate = LocalDate.now();
        openMembers.forEach(member -> {
            member.setStatus(RoomMemberStatus.LEFT);
            if (member.getMoveOutDate() == null || member.getMoveOutDate().isAfter(moveOutDate)) {
                member.setMoveOutDate(moveOutDate);
            }
        });

        roomMemberRepository.saveAll(openMembers);
    }
}
