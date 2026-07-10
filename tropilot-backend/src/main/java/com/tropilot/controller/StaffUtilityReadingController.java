package com.tropilot.controller;

import com.tropilot.dto.request.UtilityReadingCreateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.UtilityMeterFetchResponse;
import com.tropilot.dto.response.UtilityReadingFetchResponse;
import com.tropilot.dto.response.UtilityReadingOverviewResponse;
import com.tropilot.dto.response.UtilityReadingResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.UtilityReadingProvider;
import com.tropilot.service.UtilityReadingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff/utility-readings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffUtilityReadingController {

    private final UtilityReadingService utilityReadingService;
    private final UtilityReadingProvider utilityReadingProvider;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UtilityReadingResponse> createReading(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @ModelAttribute UtilityReadingCreateRequest request
    ) {
        return ApiResponse.success(
                "Utility reading created successfully",
                utilityReadingService.createReading(request, getUserId(user))
        );
    }

    @PostMapping("/fetch")
    public ApiResponse<UtilityReadingFetchResponse> fetchReading(
            @RequestParam(name = "roomId") Long roomId,
            @RequestParam(name = "readingDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate readingDate
    ) {
        return ApiResponse.success(
                "Utility readings fetched successfully",
                utilityReadingProvider.fetch(roomId, readingDate)
        );
    }

    @PostMapping("/fetch/electricity")
    public ApiResponse<UtilityMeterFetchResponse> fetchElectricityReading(
            @RequestParam(name = "roomId") Long roomId,
            @RequestParam(name = "readingDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate readingDate
    ) {
        return ApiResponse.success(
                "Electricity reading fetched successfully",
                utilityReadingProvider.fetchElectricity(roomId, readingDate)
        );
    }

    @PostMapping("/fetch/water")
    public ApiResponse<UtilityMeterFetchResponse> fetchWaterReading(
            @RequestParam(name = "roomId") Long roomId,
            @RequestParam(name = "readingDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate readingDate
    ) {
        return ApiResponse.success(
                "Water reading fetched successfully",
                utilityReadingProvider.fetchWater(roomId, readingDate)
        );
    }

    @GetMapping
    public ApiResponse<List<UtilityReadingResponse>> getReadings(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Utility readings loaded successfully", utilityReadingService.getReadings(buildingId));
    }

    @GetMapping("/overview")
    public ApiResponse<UtilityReadingOverviewResponse> getOverview(
            @RequestParam(name = "buildingId") Long buildingId,
            @RequestParam(name = "month") String month
    ) {
        return ApiResponse.success(
                "Utility reading overview loaded successfully",
                utilityReadingService.getOverview(buildingId, month)
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<UtilityReadingResponse> getReading(@PathVariable(name = "id") Long id) {
        return ApiResponse.success("Utility reading loaded successfully", utilityReadingService.getReading(id));
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
