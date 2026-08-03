package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
/** Kết quả xóa phí dịch vụ: xóa thật hoặc chỉ tắt áp dụng để bảo toàn hóa đơn cũ. */
public class ServiceFeeDeleteResponse {

    private Long id;
    private boolean deleted;
    private boolean deactivated;
    private Boolean isActive;
}
