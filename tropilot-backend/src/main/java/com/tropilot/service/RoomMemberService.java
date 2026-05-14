package com.tropilot.service;

import com.tropilot.dto.request.RoomMemberRequest;
import com.tropilot.dto.response.RoomMemberResponse;

import java.util.List;

public interface RoomMemberService {

    RoomMemberResponse createResidentMember(Long residentHeadId, RoomMemberRequest request);

    List<RoomMemberResponse> getResidentMembers(Long residentHeadId);

    RoomMemberResponse updateResidentMember(Long residentHeadId, Long memberId, RoomMemberRequest request);

    RoomMemberResponse markResidentMemberLeft(Long residentHeadId, Long memberId);

    List<RoomMemberResponse> getPendingMembers();

    List<RoomMemberResponse> getRoomMembers(Long roomId);

    RoomMemberResponse approveMember(Long memberId);

    RoomMemberResponse rejectMember(Long memberId);
}
