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
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.RoomMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomMemberServiceImpl implements RoomMemberService {

    private final RoomMemberRepository roomMemberRepository;
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
    public List<RoomMemberResponse> getPendingMembers() {
        return roomMemberRepository.findByStatusWithDetails(RoomMemberStatus.PENDING)
                .stream()
                .map(roomMemberMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getRoomMembers(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("Room not found");
        }

        return roomMemberRepository.findByRoomIdWithDetails(roomId)
                .stream()
                .map(roomMemberMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RoomMemberResponse approveMember(Long memberId) {
        RoomMember member = findMember(memberId);

        if (member.getStatus() != RoomMemberStatus.PENDING) {
            throw new BadRequestException("Only pending members can be approved");
        }

        validateActiveHeadResidentForApproval(member);
        validateRoomCapacity(member.getRoom());

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
    public RoomMemberResponse rejectMember(Long memberId) {
        RoomMember member = findMember(memberId);

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

    private void validateResidentMemberOwnership(RoomMember member, RoomAssignment assignment) {
        boolean sameRoom = member.getRoom().getId().equals(assignment.getRoom().getId());
        boolean sameResidentHead = member.getResidentHead().getId().equals(assignment.getResidentHead().getId());

        if (!sameRoom || !sameResidentHead) {
            throw new ForbiddenException("Room member does not belong to the current Head Resident room");
        }
    }

    private void validateActiveHeadResidentForApproval(RoomMember member) {
        RoomAssignment assignment = roomAssignmentRepository
                .findByRoomIdAndStatus(member.getRoom().getId(), RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Room does not have an active Head Resident"));

        if (!assignment.getResidentHead().getId().equals(member.getResidentHead().getId())) {
            throw new BadRequestException("Room member does not belong to the active Head Resident");
        }
    }

    private void validateRoomCapacity(Room room) {
        int approvedMemberCount = Math.toIntExact(roomMemberRepository.countByRoom_IdAndStatus(
                room.getId(),
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
}
