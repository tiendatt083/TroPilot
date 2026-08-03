package com.tropilot.service;

import com.tropilot.dto.response.UtilityMeterFetchResponse;

import java.time.LocalDate;

/** Hợp đồng lấy chỉ số điện, nước từ nguồn cung cấp dữ liệu hiện tại. */
public interface UtilityReadingProvider {

    UtilityMeterFetchResponse fetchElectricity(Long roomId, LocalDate readingDate);

    UtilityMeterFetchResponse fetchWater(Long roomId, LocalDate readingDate);
}
