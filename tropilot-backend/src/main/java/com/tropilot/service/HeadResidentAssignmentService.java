package com.tropilot.service;

import com.tropilot.dto.request.AssignHeadResidentRequest;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;

public interface HeadResidentAssignmentService {

    HeadResidentAssignmentResponse assignHeadResident(Long roomId, AssignHeadResidentRequest request);

    HeadResidentAssignmentResponse getHeadResidentAssignment(Long roomId);

    HeadResidentAssignmentResponse removeHeadResident(Long roomId);

    HeadResidentAssignmentResponse getResidentAssignedRoom(Long residentHeadId);
}
