package com.tropilot.service;

import com.tropilot.dto.response.UtilityReadingFetchResponse;

import java.time.LocalDate;

public interface UtilityReadingProvider {

    UtilityReadingFetchResponse fetch(Long roomId, LocalDate readingDate);
}
