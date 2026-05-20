package com.tropilot.service.impl;

import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.entity.Receipt;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

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

    @Override
    @Transactional(readOnly = true)
    public ReceiptResponse getReceipt(Long id, Long buildingId) {
        Receipt receipt = findReceipt(id);
        validateReceiptBelongsToBuilding(receipt, buildingId);

        return receiptMapper.toResponse(receipt);
    }

    private Receipt findReceipt(Long id) {
        return receiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
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

    private void validateReceiptBelongsToBuilding(Receipt receipt, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(receipt.getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Receipt does not belong to the selected building");
        }
    }
}
