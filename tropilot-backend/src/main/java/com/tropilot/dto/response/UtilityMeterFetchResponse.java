package com.tropilot.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UtilityMeterFetchResponse(
        String source,
        String meterType,
        LocalDate recordedAt,
        BigDecimal oldReading,
        BigDecimal newReading,
        BigDecimal usage
) {
}
