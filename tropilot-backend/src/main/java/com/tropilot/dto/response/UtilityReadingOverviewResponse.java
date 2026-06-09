package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class UtilityReadingOverviewResponse {

    private String month;
    private long totalRooms;
    private long recordedRooms;
    private long pendingRooms;
    private long emptyRooms;
    private List<RoomResponse> eligibleRooms;
}
