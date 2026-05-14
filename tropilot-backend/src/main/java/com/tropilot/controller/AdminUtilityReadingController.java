package com.tropilot.controller;

import com.tropilot.dto.request.UtilityReadingUpdateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.UtilityReadingResponse;
import com.tropilot.service.UtilityReadingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/utility-readings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUtilityReadingController {

    private final UtilityReadingService utilityReadingService;

    @GetMapping
    public ApiResponse<List<UtilityReadingResponse>> getReadings() {
        return ApiResponse.success("Utility readings loaded successfully", utilityReadingService.getReadings());
    }

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UtilityReadingResponse> updateReading(
            @PathVariable Long id,
            @Valid @ModelAttribute UtilityReadingUpdateRequest request
    ) {
        return ApiResponse.success("Utility reading updated successfully", utilityReadingService.updateReading(id, request));
    }
}
