package com.tropilot.service;

import com.tropilot.entity.RoomAssignment;

/** Hợp đồng kiểm tra chủ hộ có phân phòng đang hiệu lực trước khi truy cập dữ liệu cư dân. */
public interface ResidentRoomAccessService {

    RoomAssignment requireActiveAssignment(Long residentHeadId);
}
