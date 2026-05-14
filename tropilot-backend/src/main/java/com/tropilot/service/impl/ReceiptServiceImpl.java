package com.tropilot.service.impl;

import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.entity.Receipt;
import com.tropilot.exception.ResourceNotFoundException;
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
    private final ReceiptMapper receiptMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ReceiptResponse> getReceipts() {
        return receiptRepository.findAllWithDetails()
                .stream()
                .map(receiptMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReceiptResponse getReceipt(Long id) {
        return receiptMapper.toResponse(findReceipt(id));
    }

    private Receipt findReceipt(Long id) {
        return receiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
    }
}
