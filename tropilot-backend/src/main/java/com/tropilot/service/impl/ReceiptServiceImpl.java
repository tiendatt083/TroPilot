package com.tropilot.service.impl;

import com.tropilot.mapper.ReceiptMapper;
import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.entity.Receipt;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceiptServiceImpl implements ReceiptService {

    private final ReceiptRepository receiptRepository;
    private final BuildingRepository buildingRepository;
    private final ReceiptMapper receiptMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ReceiptResponse> getReceipts(Long buildingId) {
        List<Receipt> receipts = buildingId == null
                ? receiptRepository.findAllWithDetails()
                : getBuildingReceipts(buildingId);

        return receipts
                .stream()
                .map(receiptMapper::toResponse)
                .toList();
    }

    private List<Receipt> getBuildingReceipts(Long buildingId) {
        validateBuildingExists(buildingId);
        return receiptRepository.findByBuildingIdWithDetails(buildingId);
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }
}
