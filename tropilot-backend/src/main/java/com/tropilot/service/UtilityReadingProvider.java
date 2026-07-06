package com.tropilot.service;

import com.tropilot.dto.response.UtilityReadingFetchResponse;
import com.tropilot.dto.response.UtilityMeterFetchResponse;

import java.time.LocalDate;

public interface UtilityReadingProvider {

    UtilityReadingFetchResponse fetch(Long roomId, LocalDate readingDate);

    UtilityMeterFetchResponse fetchElectricity(Long roomId, LocalDate readingDate);

    UtilityMeterFetchResponse fetchWater(Long roomId, LocalDate readingDate);
}
