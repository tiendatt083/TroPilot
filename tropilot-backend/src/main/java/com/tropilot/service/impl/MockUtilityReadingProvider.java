package com.tropilot.service.impl;

import com.tropilot.dto.response.UtilityMeterFetchResponse;
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
/** Nguồn dữ liệu giả lập chỉ số điện nước, dùng khi dự án chưa kết nối đồng hồ thực tế. */
public class MockUtilityReadingProvider implements UtilityReadingProvider {

    private static final int MAX_ELECTRICITY_USAGE = 150;
    private static final int MAX_WATER_USAGE = 150;

    private final RoomRepository roomRepository;
    private final UtilityReadingRepository utilityReadingRepository;

    @Override
    public UtilityMeterFetchResponse fetchElectricity(Long roomId, LocalDate readingDate) {
        UtilityReading previousReading = findPreviousReading(roomId, readingDate);
        BigDecimal oldReading = previousReading == null
                ? BigDecimal.ZERO
                : previousReading.getNewElectricity();
        BigDecimal usage = randomUsage(MAX_ELECTRICITY_USAGE);

        return new UtilityMeterFetchResponse(
                "MOCK",
                "ELECTRICITY",
                readingDate,
                oldReading,
                oldReading.add(usage),
                usage
        );
    }

    @Override
    public UtilityMeterFetchResponse fetchWater(Long roomId, LocalDate readingDate) {
        UtilityReading previousReading = findPreviousReading(roomId, readingDate);
        BigDecimal oldReading = previousReading == null
                ? BigDecimal.ZERO
                : previousReading.getNewWater();
        BigDecimal usage = randomUsage(MAX_WATER_USAGE);

        return new UtilityMeterFetchResponse(
                "MOCK",
                "WATER",
                readingDate,
                oldReading,
                oldReading.add(usage),
                usage
        );
    }

    private UtilityReading findPreviousReading(Long roomId, LocalDate readingDate) {
        if (!roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("Room not found");
        }

        LocalDate readingMonth = readingDate.withDayOfMonth(1);
        if (utilityReadingRepository.existsByRoom_IdAndMonth(roomId, readingMonth)) {
            throw new BadRequestException("Utility reading already exists for this room and month");
        }

        return utilityReadingRepository
                .findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(roomId, readingMonth)
                .orElse(null);
    }

    private BigDecimal randomUsage(int maximum) {
        return BigDecimal.valueOf(ThreadLocalRandom.current().nextInt(1, maximum + 1));
    }
}
