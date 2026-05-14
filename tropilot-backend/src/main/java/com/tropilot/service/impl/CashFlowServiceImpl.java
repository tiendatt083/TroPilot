package com.tropilot.service.impl;

import com.tropilot.dto.response.CashFlowResponse;
import com.tropilot.dto.response.ExpenseResponse;
import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.enums.ExpenseStatus;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.ReceiptStatus;
import com.tropilot.exception.BadRequestException;
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
    private final ReceiptMapper receiptMapper;
    private final ExpenseMapper expenseMapper;

    @Override
    @Transactional(readOnly = true)
    public CashFlowResponse getCashFlow(String month) {
        YearMonth yearMonth = parseMonth(month);
        LocalDate monthDate = yearMonth.atDay(1);
        LocalDateTime startDateTime = monthDate.atStartOfDay();
        LocalDateTime endDateTime = monthDate.plusMonths(1).atStartOfDay();

        BigDecimal totalIncome = receiptRepository.sumAmountByStatusAndCreatedAtBetween(
                ReceiptStatus.VALID,
                startDateTime,
                endDateTime
        );
        BigDecimal totalExpense = expenseRepository.sumAmountByStatusAndCreatedAtBetween(
                ExpenseStatus.VALID,
                startDateTime,
                endDateTime
        );
        BigDecimal unpaidAmount = invoiceRepository.sumUnpaidAmountByMonth(monthDate, InvoiceStatus.PAID);

        List<ReceiptResponse> receipts = receiptRepository
                .findByStatusAndCreatedAtBetweenWithDetails(ReceiptStatus.VALID, startDateTime, endDateTime)
                .stream()
                .map(receiptMapper::toResponse)
                .toList();
        List<ExpenseResponse> expenses = expenseRepository
                .findByStatusAndCreatedAtBetweenWithDetails(ExpenseStatus.VALID, startDateTime, endDateTime)
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
