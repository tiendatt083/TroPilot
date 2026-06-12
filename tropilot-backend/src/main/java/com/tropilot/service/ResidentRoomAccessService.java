package com.tropilot.service;

import com.tropilot.entity.RoomAssignment;

public interface ResidentRoomAccessService {

    RoomAssignment requireActiveAssignment(Long residentHeadId);
}
