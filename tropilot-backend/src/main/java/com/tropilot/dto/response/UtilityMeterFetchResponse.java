package com.tropilot.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Kết quả đọc chỉ số từ nguồn hỗ trợ: nguồn dữ liệu, loại đồng hồ, kỳ ghi và mức tiêu thụ. */
public record UtilityMeterFetchResponse(
        String source,
        String meterType,
        LocalDate recordedAt,
        BigDecimal oldReading,
        BigDecimal newReading,
        BigDecimal usage
) {
}
