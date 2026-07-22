package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.service.RentalContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/contracts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminContractController {

    private final RentalContractService rentalContractService;

    @GetMapping
    public ApiResponse<List<RentalContractResponse>> getContracts(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Rental contracts loaded successfully", rentalContractService.getContracts(buildingId));
    }

    @GetMapping("/{id}")
    public ApiResponse<RentalContractResponse> getContract(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success("Rental contract loaded successfully", rentalContractService.getContract(id, buildingId));
    }

    @PostMapping("/{id}/upload")
    public ApiResponse<RentalContractResponse> uploadContract(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @RequestParam("file") MultipartFile file
    ) {
        return ApiResponse.success(
                "Rental contract uploaded successfully",
                rentalContractService.uploadContract(id, buildingId, file)
        );
    }
}
