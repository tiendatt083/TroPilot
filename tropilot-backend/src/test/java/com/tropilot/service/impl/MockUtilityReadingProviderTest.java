package com.tropilot.service.impl;

import com.tropilot.dto.response.UtilityMeterFetchResponse;
import com.tropilot.entity.UtilityReading;
import com.tropilot.exception.BadRequestException;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UtilityReadingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MockUtilityReadingProviderTest {

    private static final Long ROOM_ID = 12L;
    private static final LocalDate READING_DATE = LocalDate.of(2026, 7, 15);
    private static final LocalDate READING_MONTH = LocalDate.of(2026, 7, 1);

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UtilityReadingRepository utilityReadingRepository;

    @InjectMocks
    private MockUtilityReadingProvider provider;

    @Test
    void fetchUsesPreviousReadingAndGeneratesValidUsage() {
        UtilityReading previousReading = UtilityReading.builder()
                .newElectricity(new BigDecimal("350"))
                .newWater(new BigDecimal("24"))
                .build();
        when(roomRepository.existsById(ROOM_ID)).thenReturn(true);
        when(utilityReadingRepository.existsByRoom_IdAndMonth(ROOM_ID, READING_MONTH)).thenReturn(false);
        when(utilityReadingRepository.findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(
                ROOM_ID,
                READING_MONTH
        )).thenReturn(Optional.of(previousReading));

        UtilityMeterFetchResponse electricity = provider.fetchElectricity(ROOM_ID, READING_DATE);
        UtilityMeterFetchResponse water = provider.fetchWater(ROOM_ID, READING_DATE);

        assertThat(electricity.source()).isEqualTo("MOCK");
        assertThat(electricity.recordedAt()).isEqualTo(READING_DATE);
        assertThat(electricity.oldReading()).isEqualByComparingTo("350");
        assertThat(electricity.usage()).isBetween(BigDecimal.ONE, new BigDecimal("150"));
        assertThat(electricity.newReading()).isEqualByComparingTo(electricity.oldReading().add(electricity.usage()));

        assertThat(water.source()).isEqualTo("MOCK");
        assertThat(water.recordedAt()).isEqualTo(READING_DATE);
        assertThat(water.oldReading()).isEqualByComparingTo("24");
        assertThat(water.usage()).isBetween(BigDecimal.ONE, new BigDecimal("150"));
        assertThat(water.newReading()).isEqualByComparingTo(water.oldReading().add(water.usage()));
    }

    @Test
    void fetchElectricityAndWaterReturnSeparateMeterPayloads() {
        UtilityReading previousReading = UtilityReading.builder()
                .newElectricity(new BigDecimal("350"))
                .newWater(new BigDecimal("24"))
                .build();
        when(roomRepository.existsById(ROOM_ID)).thenReturn(true);
        when(utilityReadingRepository.existsByRoom_IdAndMonth(ROOM_ID, READING_MONTH)).thenReturn(false);
        when(utilityReadingRepository.findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(
                ROOM_ID,
                READING_MONTH
        )).thenReturn(Optional.of(previousReading));

        UtilityMeterFetchResponse electricity = provider.fetchElectricity(ROOM_ID, READING_DATE);
        UtilityMeterFetchResponse water = provider.fetchWater(ROOM_ID, READING_DATE);

        assertThat(electricity.meterType()).isEqualTo("ELECTRICITY");
        assertThat(electricity.oldReading()).isEqualByComparingTo("350");
        assertThat(electricity.usage()).isBetween(BigDecimal.ONE, new BigDecimal("150"));
        assertThat(electricity.newReading()).isEqualByComparingTo(electricity.oldReading().add(electricity.usage()));

        assertThat(water.meterType()).isEqualTo("WATER");
        assertThat(water.oldReading()).isEqualByComparingTo("24");
        assertThat(water.usage()).isBetween(BigDecimal.ONE, new BigDecimal("150"));
        assertThat(water.newReading()).isEqualByComparingTo(water.oldReading().add(water.usage()));
    }

    @Test
    void fetchStartsAtZeroWhenThereIsNoPreviousReading() {
        when(roomRepository.existsById(ROOM_ID)).thenReturn(true);
        when(utilityReadingRepository.existsByRoom_IdAndMonth(ROOM_ID, READING_MONTH)).thenReturn(false);
        when(utilityReadingRepository.findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(
                ROOM_ID,
                READING_MONTH
        )).thenReturn(Optional.empty());

        UtilityMeterFetchResponse electricity = provider.fetchElectricity(ROOM_ID, READING_DATE);
        UtilityMeterFetchResponse water = provider.fetchWater(ROOM_ID, READING_DATE);

        assertThat(electricity.oldReading()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(water.oldReading()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void fetchRejectsRoomWithReadingInTheSelectedMonth() {
        when(roomRepository.existsById(ROOM_ID)).thenReturn(true);
        when(utilityReadingRepository.existsByRoom_IdAndMonth(ROOM_ID, READING_MONTH)).thenReturn(true);

        assertThatThrownBy(() -> provider.fetchElectricity(ROOM_ID, READING_DATE))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");
    }
}
