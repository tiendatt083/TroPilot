package com.tropilot.service;

import com.tropilot.dto.request.AssignHeadResidentRequest;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;

/** Hợp đồng phân phòng, thay đổi hoặc gỡ chủ hộ đại diện của phòng. */
public interface HeadResidentAssignmentService {

    HeadResidentAssignmentResponse assignHeadResident(Long roomId, AssignHeadResidentRequest request);

    HeadResidentAssignmentResponse getHeadResidentAssignment(Long roomId);

    HeadResidentAssignmentResponse removeHeadResident(Long roomId);

    HeadResidentAssignmentResponse getResidentAssignedRoom(Long residentHeadId);
}
