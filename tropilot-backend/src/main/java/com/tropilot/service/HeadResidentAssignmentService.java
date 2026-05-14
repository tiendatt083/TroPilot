package com.tropilot.service;

import com.tropilot.dto.request.AssignHeadResidentRequest;
import com.tropilot.dto.response.RoomHeadResponse;

public interface HeadResidentAssignmentService {

    RoomHeadResponse assignHeadResident(Long roomId, AssignHeadResidentRequest request);

    RoomHeadResponse getRoomHead(Long roomId);

    RoomHeadResponse removeHeadResident(Long roomId);

    RoomHeadResponse getResidentAssignedRoom(Long residentHeadId);
}
