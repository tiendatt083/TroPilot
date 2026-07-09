package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InvoiceBulkBlockedRoomResponse {

    private Long roomId;
    private String roomCode;
    private String roomName;
    private String residentHeadName;
    private String reasonCode;
    private String reason;
}
