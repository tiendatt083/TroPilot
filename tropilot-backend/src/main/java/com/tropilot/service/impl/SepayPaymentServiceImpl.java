package com.tropilot.service.impl;

import com.tropilot.config.SepayProperties;
import com.tropilot.dto.request.SepayWebhookRequest;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.SepayPayment;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.ReceiptStatus;
import com.tropilot.enums.SepayPaymentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.repository.SepayPaymentRepository;
import com.tropilot.service.NotificationService;
import com.tropilot.service.PaymentEmailService;
import com.tropilot.service.ReceiptCreationService;
import com.tropilot.service.SepayPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
/** Tạo QR thanh toán SePay, xác thực webhook ngân hàng và cập nhật kết quả giao dịch cho hóa đơn. */
public class SepayPaymentServiceImpl implements SepayPaymentService {

    private final SepayProperties sepayProperties;
    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final SepayPaymentRepository sepayPaymentRepository;
    private final ReceiptCreationService receiptCreationService;
    private final NotificationService notificationService;
    private final PaymentEmailService paymentEmailService;

    @Override
    @Transactional
    /** Tạo giao dịch SePay và QR cho hóa đơn nếu cấu hình thanh toán đang được bật. */
    public Optional<SepayPayment> createForInvoice(Invoice invoice) {
        if (!sepayProperties.isReady()) {
            return Optional.empty();
        }

        Optional<SepayPayment> existingPayment = sepayPaymentRepository.findByInvoice_Id(invoice.getId());
        if (existingPayment.isPresent()) {
            return existingPayment;
        }

        String paymentCode = sepayProperties.getPaymentCodePrefix() + invoice.getId();
        SepayPayment payment = SepayPayment.builder()
                .invoice(invoice)
                .paymentCode(paymentCode)
                .amount(invoice.getTotalAmount())
                .bankCode(sepayProperties.getBankCode().trim())
                .accountNumber(sepayProperties.getAccountNumber().trim())
                .accountName(sepayProperties.getAccountName().trim())
                .qrImageUrl(buildQrImageUrl(paymentCode, invoice.getTotalAmount()))
                .status(SepayPaymentStatus.PENDING)
                .build();

        SepayPayment savedPayment = sepayPaymentRepository.save(payment);
        notificationService.createInvoiceIssuedNotification(invoice.getCreatedBy(), invoice, savedPayment);
        return Optional.of(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SepayPayment> findByInvoiceId(Long invoiceId) {
        return sepayPaymentRepository.findByInvoice_Id(invoiceId);
    }

    @Override
    @Transactional
    /** Xác thực webhook SePay, đối chiếu số tiền/nội dung rồi đánh dấu hóa đơn đã thanh toán và tạo biên lai. */
    public void handleWebhook(SepayWebhookRequest request, String authorizationHeader) {
        validateWebhookSecret(authorizationHeader);

        if (isSepayTestWebhook(request)) {
            log.info("Accepted SePay test webhook.");
            return;
        }

        SepayPayment payment = findPaymentFromWebhook(request);
        if (payment.getStatus() == SepayPaymentStatus.PAID) {
            return;
        }

        Invoice invoice = payment.getInvoice();
        validateIncomingTransfer(request, payment);

        LocalDateTime paidAt = LocalDateTime.now();
        payment.setStatus(SepayPaymentStatus.PAID);
        payment.setSepayTransactionId(clean(request.getTransactionId()));
        payment.setReferenceCode(clean(request.getReferenceCode()));
        payment.setPaidAmount(request.getTransferAmount());
        payment.setPaidAt(paidAt);
        payment.setWebhookContent(webhookContent(request));
        payment.setLastWebhookError(null);

        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        if (!receiptRepository.existsByInvoice_IdAndStatus(invoice.getId(), ReceiptStatus.VALID)) {
            receiptRepository.save(receiptCreationService.createValidReceipt(invoice, invoice.getCreatedBy(), paidAt));
        }

        notificationService.createInvoicePaidNotification(invoice.getCreatedBy(), invoice, payment);
        paymentEmailService.sendPaymentSuccessEmail(invoice, paidAt);

        sepayPaymentRepository.save(payment);
    }

    private String buildQrImageUrl(String paymentCode, BigDecimal amount) {
        return UriComponentsBuilder
                .fromHttpUrl(sepayProperties.getQrBaseUrl())
                .queryParam("bank", sepayProperties.getBankCode().trim())
                .queryParam("acc", sepayProperties.getAccountNumber().trim())
                .queryParam("amount", amount.toPlainString())
                .queryParam("des", paymentCode)
                .queryParam("template", sepayProperties.getQrTemplate())
                .build()
                .toUriString();
    }

    private void validateWebhookSecret(String authorizationHeader) {
        String secret = sepayProperties.getWebhookSecret();
        if (secret == null || secret.isBlank()) {
            return;
        }

        String cleanSecret = secret.trim();
        String cleanHeader = authorizationHeader == null ? "" : authorizationHeader.trim();
        boolean valid = cleanHeader.equals(cleanSecret)
                || cleanHeader.equals("Bearer " + cleanSecret)
                || cleanHeader.equals("Apikey " + cleanSecret);

        if (!valid) {
            throw new BadRequestException("Invalid SePay webhook authorization");
        }
    }

    private boolean isSepayTestWebhook(SepayWebhookRequest request) {
        return "SEPAYTEST".equalsIgnoreCase(clean(request.getCode()))
                && "SEPAY TEST WEBHOOK".equalsIgnoreCase(clean(request.getContent()));
    }

    private SepayPayment findPaymentFromWebhook(SepayWebhookRequest request) {
        String referenceCode = clean(request.getReferenceCode());
        if (referenceCode != null) {
            Optional<SepayPayment> byReferenceCode = sepayPaymentRepository.findByReferenceCode(referenceCode);
            if (byReferenceCode.isPresent()) {
                return byReferenceCode.get();
            }
        }

        String paymentCode = clean(request.getCode());
        if (paymentCode != null) {
            Optional<SepayPayment> byPaymentCode = sepayPaymentRepository.findByPaymentCode(paymentCode);
            if (byPaymentCode.isPresent()) {
                return byPaymentCode.get();
            }
        }

        paymentCode = extractPaymentCode(webhookContent(request));
        if (paymentCode == null) {
            throw new BadRequestException("SePay payment code was not found in webhook content");
        }

        return sepayPaymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new BadRequestException("SePay payment code does not match any invoice"));
    }

    private void validateIncomingTransfer(SepayWebhookRequest request, SepayPayment payment) {
        if (request.getTransferAmount() == null) {
            markWebhookError(payment, "Transfer amount is required");
        }

        String transferType = clean(request.getTransferType());
        if (transferType != null && !"in".equalsIgnoreCase(transferType)) {
            markWebhookError(payment, "Only incoming bank transfers can pay invoices");
        }

        String accountNumber = clean(request.getAccountNumber());
        if (accountNumber != null && !accountNumber.equals(payment.getAccountNumber())) {
            markWebhookError(payment, "Webhook account number does not match invoice payment account");
        }

        if (request.getTransferAmount().compareTo(payment.getAmount()) != 0) {
            markWebhookError(payment, "Transfer amount does not match invoice total amount");
        }
    }

    private void markWebhookError(SepayPayment payment, String errorMessage) {
        payment.setLastWebhookError(errorMessage);
        sepayPaymentRepository.save(payment);
        throw new BadRequestException(errorMessage);
    }

    private String extractPaymentCode(String content) {
        if (content == null || content.isBlank()) {
            return null;
        }

        Pattern pattern = Pattern.compile(Pattern.quote(sepayProperties.getPaymentCodePrefix()) + "\\d+");
        Matcher matcher = pattern.matcher(content);
        return matcher.find() ? matcher.group() : null;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String webhookContent(SepayWebhookRequest request) {
        String content = clean(request.getContent());
        return content != null ? content : clean(request.getDescription());
    }
}
