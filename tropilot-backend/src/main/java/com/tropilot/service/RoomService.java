package com.tropilot.service;

import com.tropilot.dto.request.RoomRequest;
import com.tropilot.dto.response.RoomResponse;

import java.util.List;

public interface RoomService {

    RoomResponse createRoom(RoomRequest request);

    List<RoomResponse> getRooms(Long buildingId, String status, String search);

    RoomResponse getRoom(Long id);

    RoomResponse updateRoom(Long id, RoomRequest request);

    void deleteRoom(Long id);
}
