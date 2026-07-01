package com.tropilot.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UtilityReadingFetchResponse(
        String source,
        LocalDate recordedAt,
        BigDecimal oldElectricity,
        BigDecimal newElectricity,
        BigDecimal electricityUsage,
        BigDecimal oldWater,
        BigDecimal newWater,
        BigDecimal waterUsage
) {
}
