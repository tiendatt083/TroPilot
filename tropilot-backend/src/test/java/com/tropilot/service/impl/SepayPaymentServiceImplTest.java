package com.tropilot.service.impl;

import com.tropilot.config.SepayProperties;
import com.tropilot.dto.request.SepayWebhookRequest;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Receipt;
import com.tropilot.entity.Room;
import com.tropilot.entity.SepayPayment;
import com.tropilot.entity.User;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.ReceiptStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.SepayPaymentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.repository.SepayPaymentRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.NotificationService;
import com.tropilot.service.PaymentEmailService;
import com.tropilot.service.ReceiptCreationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
/** Kiểm tra webhook SePay thanh toán hóa đơn, đối chiếu số tiền và xử lý lặp webhook an toàn. */
class SepayPaymentServiceImplTest {

    private static final String DEMO_ACCOUNT_NUMBER = "1234567890";

    @Spy
    private SepayProperties sepayProperties = new SepayProperties();

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private ReceiptRepository receiptRepository;

    @Mock
    private SepayPaymentRepository sepayPaymentRepository;

    @Mock
    private ReceiptCreationService receiptCreationService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private PaymentEmailService paymentEmailService;

    @InjectMocks
    private SepayPaymentServiceImpl service;

    @BeforeEach
    void configureSepay() {
        sepayProperties.setEnabled(true);
        sepayProperties.setBankCode("TPB");
        sepayProperties.setAccountNumber(DEMO_ACCOUNT_NUMBER);
        sepayProperties.setAccountName("Tropilot Demo");
        sepayProperties.setPaymentCodePrefix("TPINV");
        sepayProperties.setWebhookSecret("test-secret");
    }

    @Test
    void handleWebhookMarksInvoicePaidAndCreatesReceipt() {
        User admin = BusinessRuleTestFixtures.admin();
        User residentHead = BusinessRuleTestFixtures.residentHead();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        Invoice invoice = BusinessRuleTestFixtures.invoice(room, residentHead, admin, InvoiceStatus.UNPAID);
        SepayPayment payment = payment(invoice);
        SepayWebhookRequest request = webhookRequest(payment.getPaymentCode(), payment.getAmount());
        Receipt receipt = Receipt.builder()
                .receiptCode("RCT-300")
                .invoice(invoice)
                .room(room)
                .residentHead(residentHead)
                .amount(invoice.getTotalAmount())
                .content("Invoice payment")
                .createdBy(admin)
                .createdAt(LocalDateTime.now())
                .status(ReceiptStatus.VALID)
                .build();

        when(sepayPaymentRepository.findByPaymentCode(payment.getPaymentCode())).thenReturn(Optional.of(payment));
        when(receiptRepository.existsByInvoice_IdAndStatus(invoice.getId(), ReceiptStatus.VALID)).thenReturn(false);
        when(receiptCreationService.createValidReceipt(eq(invoice), eq(admin), any(LocalDateTime.class)))
                .thenReturn(receipt);

        service.handleWebhook(request, "Apikey test-secret");

        assertThat(invoice.getStatus()).isEqualTo(InvoiceStatus.PAID);
        assertThat(payment.getStatus()).isEqualTo(SepayPaymentStatus.PAID);
        assertThat(payment.getPaidAmount()).isEqualByComparingTo(payment.getAmount());
        assertThat(payment.getLastWebhookError()).isNull();
        verify(invoiceRepository).save(invoice);
        verify(receiptRepository).save(receipt);
        verify(sepayPaymentRepository).save(payment);
        verify(notificationService).createInvoicePaidNotification(admin, invoice, payment);
        verify(paymentEmailService).sendPaymentSuccessEmail(eq(invoice), any(LocalDateTime.class));
    }

    @Test
    void handleWebhookRejectsWrongAmountAndKeepsInvoiceUnpaid() {
        User admin = BusinessRuleTestFixtures.admin();
        User residentHead = BusinessRuleTestFixtures.residentHead();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        Invoice invoice = BusinessRuleTestFixtures.invoice(room, residentHead, admin, InvoiceStatus.UNPAID);
        SepayPayment payment = payment(invoice);
        SepayWebhookRequest request = webhookRequest(payment.getPaymentCode(), new BigDecimal("1000"));

        when(sepayPaymentRepository.findByPaymentCode(payment.getPaymentCode())).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> service.handleWebhook(request, "Bearer test-secret"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("does not match");

        assertThat(invoice.getStatus()).isEqualTo(InvoiceStatus.UNPAID);
        assertThat(payment.getStatus()).isEqualTo(SepayPaymentStatus.PENDING);
        assertThat(payment.getLastWebhookError()).contains("does not match");
        verify(sepayPaymentRepository).save(payment);
        verify(invoiceRepository, never()).save(any());
        verify(receiptRepository, never()).save(any());
        verify(paymentEmailService, never()).sendPaymentSuccessEmail(any(), any());
    }

    @Test
    void handleWebhookIsIdempotentAfterPaymentWasCompleted() {
        User admin = BusinessRuleTestFixtures.admin();
        User residentHead = BusinessRuleTestFixtures.residentHead();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        Invoice invoice = BusinessRuleTestFixtures.invoice(room, residentHead, admin, InvoiceStatus.PAID);
        SepayPayment payment = payment(invoice);
        payment.setStatus(SepayPaymentStatus.PAID);
        SepayWebhookRequest request = webhookRequest(payment.getPaymentCode(), payment.getAmount());

        when(sepayPaymentRepository.findByPaymentCode(payment.getPaymentCode())).thenReturn(Optional.of(payment));

        service.handleWebhook(request, "Apikey test-secret");

        verify(invoiceRepository, never()).save(any());
        verify(receiptRepository, never()).save(any());
        verify(sepayPaymentRepository, never()).save(any());
        verify(notificationService, never()).createInvoicePaidNotification(any(), any(), any());
        verify(paymentEmailService, never()).sendPaymentSuccessEmail(any(), any());
    }

    private SepayPayment payment(Invoice invoice) {
        return SepayPayment.builder()
                .id(400L)
                .invoice(invoice)
                .paymentCode("TPINV" + invoice.getId())
                .amount(invoice.getTotalAmount())
                .bankCode("TPB")
                .accountNumber(DEMO_ACCOUNT_NUMBER)
                .accountName("Tropilot Demo")
                .qrImageUrl("https://example.test/qr")
                .status(SepayPaymentStatus.PENDING)
                .build();
    }

    private SepayWebhookRequest webhookRequest(String paymentCode, BigDecimal amount) {
        SepayWebhookRequest request = new SepayWebhookRequest();
        request.setTransactionId("TX-001");
        request.setAccountNumber(DEMO_ACCOUNT_NUMBER);
        request.setCode(paymentCode);
        request.setContent(paymentCode);
        request.setTransferType("in");
        request.setTransferAmount(amount);
        return request;
    }
}
