package com.tropilot.service;

import com.tropilot.dto.request.RoomMemberUpsertRequest;
import com.tropilot.dto.response.RoomMemberResponse;

import java.util.List;

/** Hợp đồng đăng ký, duyệt, từ chối và quản lý thành viên sống trong phòng. */
public interface RoomMemberService {

    RoomMemberResponse createResidentMember(Long residentHeadId, RoomMemberUpsertRequest request);

    List<RoomMemberResponse> getResidentMembers(Long residentHeadId);

    RoomMemberResponse updateResidentMember(Long residentHeadId, Long memberId, RoomMemberUpsertRequest request);

    RoomMemberResponse markResidentMemberLeft(Long residentHeadId, Long memberId);

    List<RoomMemberResponse> getPendingMembers(Long buildingId);

    List<RoomMemberResponse> getBuildingMembers(Long buildingId);

    List<RoomMemberResponse> getRoomMembers(Long roomId);

    RoomMemberResponse approveMember(Long memberId, Long approvedById, Long buildingId);

    RoomMemberResponse rejectMember(Long memberId, Long rejectedById, Long buildingId);
}
