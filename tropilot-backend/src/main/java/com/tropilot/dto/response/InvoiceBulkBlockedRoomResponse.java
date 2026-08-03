package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
/** Phòng không thể tạo hóa đơn hàng loạt, kèm mã và lời giải thích lý do. */
public class InvoiceBulkBlockedRoomResponse {

    private Long roomId;
    private String roomCode;
    private String roomName;
    private String residentHeadName;
    private String reasonCode;
    private String reason;
}
