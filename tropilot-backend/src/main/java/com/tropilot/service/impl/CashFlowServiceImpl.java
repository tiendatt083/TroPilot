package com.tropilot.service.impl;

import com.tropilot.dto.response.CashFlowResponse;
import com.tropilot.dto.response.ExpenseResponse;
import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.entity.Expense;
import com.tropilot.entity.Receipt;
import com.tropilot.enums.ExpenseStatus;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.ReceiptStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.ExpenseRepository;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.service.CashFlowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CashFlowServiceImpl implements CashFlowService {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final ReceiptRepository receiptRepository;
    private final ExpenseRepository expenseRepository;
    private final InvoiceRepository invoiceRepository;
    private final BuildingRepository buildingRepository;
    private final ReceiptMapper receiptMapper;
    private final ExpenseMapper expenseMapper;

    @Override
    @Transactional(readOnly = true)
    public CashFlowResponse getCashFlow(String month, Long buildingId) {
        validateBuildingExists(buildingId);

        YearMonth yearMonth = parseMonth(month);
        LocalDate monthDate = yearMonth.atDay(1);
        LocalDateTime startDateTime = monthDate.atStartOfDay();
        LocalDateTime endDateTime = monthDate.plusMonths(1).atStartOfDay();

        BigDecimal totalIncome = getTotalIncome(buildingId, startDateTime, endDateTime);
        BigDecimal totalExpense = getTotalExpense(buildingId, startDateTime, endDateTime);
        BigDecimal unpaidAmount = getUnpaidAmount(buildingId, monthDate);

        List<ReceiptResponse> receipts = getReceipts(buildingId, startDateTime, endDateTime)
                .stream()
                .map(receiptMapper::toResponse)
                .toList();
        List<ExpenseResponse> expenses = getExpenses(buildingId, startDateTime, endDateTime)
                .stream()
                .map(expenseMapper::toResponse)
                .toList();

        return CashFlowResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .remainingCash(totalIncome.subtract(totalExpense))
                .unpaidAmount(unpaidAmount)
                .month(yearMonth.format(MONTH_FORMATTER))
                .receipts(receipts)
                .expenses(expenses)
                .build();
    }

    private BigDecimal getTotalIncome(Long buildingId, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        if (buildingId == null) {
            return receiptRepository.sumAmountByStatusAndCreatedAtBetween(
                    ReceiptStatus.VALID,
                    startDateTime,
                    endDateTime
            );
        }

        return receiptRepository.sumAmountByBuildingIdAndStatusAndCreatedAtBetween(
                buildingId,
                ReceiptStatus.VALID,
                startDateTime,
                endDateTime
        );
    }

    private BigDecimal getTotalExpense(Long buildingId, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        if (buildingId == null) {
            return expenseRepository.sumAmountByStatusAndCreatedAtBetween(
                    ExpenseStatus.VALID,
                    startDateTime,
                    endDateTime
            );
        }

        return expenseRepository.sumAmountByBuildingIdAndStatusAndCreatedAtBetween(
                buildingId,
                ExpenseStatus.VALID,
                startDateTime,
                endDateTime
        );
    }

    private BigDecimal getUnpaidAmount(Long buildingId, LocalDate monthDate) {
        if (buildingId == null) {
            return invoiceRepository.sumUnpaidAmountByMonth(monthDate, InvoiceStatus.PAID);
        }

        return invoiceRepository.sumUnpaidAmountByBuildingIdAndMonth(buildingId, monthDate, InvoiceStatus.PAID);
    }

    private List<Receipt> getReceipts(
            Long buildingId,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    ) {
        if (buildingId == null) {
            return receiptRepository.findByStatusAndCreatedAtBetweenWithDetails(
                    ReceiptStatus.VALID,
                    startDateTime,
                    endDateTime
            );
        }

        return receiptRepository.findByBuildingIdAndStatusAndCreatedAtBetweenWithDetails(
                buildingId,
                ReceiptStatus.VALID,
                startDateTime,
                endDateTime
        );
    }

    private List<Expense> getExpenses(
            Long buildingId,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    ) {
        if (buildingId == null) {
            return expenseRepository.findByStatusAndCreatedAtBetweenWithDetails(
                    ExpenseStatus.VALID,
                    startDateTime,
                    endDateTime
            );
        }

        return expenseRepository.findByBuildingIdAndStatusAndCreatedAtBetweenWithDetails(
                buildingId,
                ExpenseStatus.VALID,
                startDateTime,
                endDateTime
        );
    }

    private void validateBuildingExists(Long buildingId) {
        if (buildingId != null && !buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now();
        }

        try {
            return YearMonth.parse(month.trim());
        } catch (RuntimeException exception) {
            throw new BadRequestException("Cash flow month must use YYYY-MM format");
        }
    }
}
