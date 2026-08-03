package com.tropilot.service;

import com.tropilot.dto.request.RoomUpsertRequest;
import com.tropilot.dto.response.RoomResponse;

import java.util.List;

/** Hợp đồng quản lý phòng và lọc danh sách phòng theo tòa nhà/trạng thái/từ khóa. */
public interface RoomService {

    RoomResponse createRoom(RoomUpsertRequest request);

    List<RoomResponse> getRooms(Long buildingId, String status, String search);

    RoomResponse getRoom(Long id);

    RoomResponse updateRoom(Long id, RoomUpsertRequest request);

    void deleteRoom(Long id);
}
