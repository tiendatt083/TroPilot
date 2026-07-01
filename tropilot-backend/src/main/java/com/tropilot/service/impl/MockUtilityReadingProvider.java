package com.tropilot.service.impl;

import com.tropilot.dto.response.UtilityReadingFetchResponse;
import com.tropilot.entity.UtilityReading;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UtilityReadingRepository;
import com.tropilot.service.UtilityReadingProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class MockUtilityReadingProvider implements UtilityReadingProvider {

    private static final int MAX_ELECTRICITY_USAGE = 150;
    private static final int MAX_WATER_USAGE = 20;

    private final RoomRepository roomRepository;
    private final UtilityReadingRepository utilityReadingRepository;

    @Override
    public UtilityReadingFetchResponse fetch(Long roomId, LocalDate readingDate) {
        if (!roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("Room not found");
        }

        LocalDate readingMonth = readingDate.withDayOfMonth(1);
        if (utilityReadingRepository.existsByRoom_IdAndMonth(roomId, readingMonth)) {
            throw new BadRequestException("Utility reading already exists for this room and month");
        }

        UtilityReading previousReading = utilityReadingRepository
                .findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(roomId, readingMonth)
                .orElse(null);
        BigDecimal oldElectricity = previousReading == null
                ? BigDecimal.ZERO
                : previousReading.getNewElectricity();
        BigDecimal oldWater = previousReading == null
                ? BigDecimal.ZERO
                : previousReading.getNewWater();
        BigDecimal electricityUsage = randomUsage(MAX_ELECTRICITY_USAGE);
        BigDecimal waterUsage = randomUsage(MAX_WATER_USAGE);

        return new UtilityReadingFetchResponse(
                "MOCK",
                readingDate,
                oldElectricity,
                oldElectricity.add(electricityUsage),
                electricityUsage,
                oldWater,
                oldWater.add(waterUsage),
                waterUsage
        );
    }

    private BigDecimal randomUsage(int maximum) {
        return BigDecimal.valueOf(ThreadLocalRandom.current().nextInt(1, maximum + 1));
    }
}
