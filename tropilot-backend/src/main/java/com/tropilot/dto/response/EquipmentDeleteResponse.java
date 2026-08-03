package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
/** Kết quả xóa thiết bị: xóa thật hoặc chỉ ngừng sử dụng để giữ lịch sử. */
public class EquipmentDeleteResponse {

    private Long id;
    private boolean deleted;
    private boolean deactivated;
}
