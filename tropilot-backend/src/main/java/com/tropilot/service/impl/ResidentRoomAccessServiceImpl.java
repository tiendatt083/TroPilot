package com.tropilot.service.impl;

import com.tropilot.entity.RoomAssignment;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.service.ResidentRoomAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
/** Kiểm tra và trả về phân phòng ACTIVE của chủ hộ trước khi cho phép dùng dữ liệu cư dân. */
public class ResidentRoomAccessServiceImpl implements ResidentRoomAccessService {

    static final String ACTIVE_ROOM_REQUIRED_MESSAGE =
            "An active room assignment is required to use resident features";

    private final RoomAssignmentRepository roomAssignmentRepository;

    @Override
    @Transactional(readOnly = true)
    public RoomAssignment requireActiveAssignment(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException(ACTIVE_ROOM_REQUIRED_MESSAGE));
    }
}
