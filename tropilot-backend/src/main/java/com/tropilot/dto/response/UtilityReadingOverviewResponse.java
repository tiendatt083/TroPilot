package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
/** Tổng quan việc ghi chỉ số theo tháng và danh sách phòng đủ điều kiện cần ghi. */
public class UtilityReadingOverviewResponse {

    private String month;
    private long totalRooms;
    private long recordedRooms;
    private long pendingRooms;
    private long emptyRooms;
    private List<RoomResponse> eligibleRooms;
}
