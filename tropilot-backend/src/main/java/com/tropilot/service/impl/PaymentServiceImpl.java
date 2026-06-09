package com.tropilot.service.impl;

import com.tropilot.storage.PaymentProofStorageService;
import com.tropilot.mapper.PaymentMapper;
import com.tropilot.dto.request.PaymentDecisionRequest;
import com.tropilot.dto.request.PaymentUploadRequest;
import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Payment;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.PaymentStatus;
import com.tropilot.enums.ReceiptStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.PaymentRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.PaymentService;
import com.tropilot.service.ReceiptCreationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final BuildingRepository buildingRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final UserRepository userRepository;
    private final PaymentProofStorageService paymentProofStorageService;
    private final PaymentMapper paymentMapper;
    private final ReceiptCreationService receiptCreationService;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public PaymentResponse uploadPaymentProof(Long residentHeadId, PaymentUploadRequest request) {
        RoomAssignment assignment = findResidentAssignment(residentHeadId);
        Invoice invoice = findInvoice(request.getInvoiceId());

        validateResidentInvoiceAccess(assignment, invoice);
        validateInvoiceCanReceivePayment(invoice);

        String proofImageUrl = paymentProofStorageService.store(request.getProofImage());
        Payment payment = Payment.builder()
                .invoice(invoice)
                .residentHead(assignment.getResidentHead())
                .proofImageUrl(proofImageUrl)
                .status(PaymentStatus.PENDING)
                .note(normalizeNote(request.getNote()))
                .build();

        invoice.setStatus(InvoiceStatus.PENDING_CONFIRMATION);
        invoiceRepository.save(invoice);

        Payment savedPayment = paymentRepository.save(payment);
        activityLogService.record(
                assignment.getResidentHead(),
                "PAYMENT_PROOF_UPLOADED",
                "Uploaded payment proof for invoice " + invoice.getId()
        );

        return paymentMapper.toResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getResidentPayments(Long residentHeadId) {
        return paymentRepository.findByResidentHeadIdWithDetails(residentHeadId)
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPendingPayments(Long buildingId) {
        List<Payment> payments = buildingId == null
                ? paymentRepository.findByStatusWithDetails(PaymentStatus.PENDING)
                : getBuildingPendingPayments(buildingId);

        return payments
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PaymentResponse approvePayment(
            Long paymentId,
            Long confirmedById,
            PaymentDecisionRequest request,
            Long buildingId
    ) {
        Payment payment = findPayment(paymentId);
        User confirmedBy = findUser(confirmedById);
        Invoice invoice = payment.getInvoice();

        validatePaymentBelongsToBuilding(payment, buildingId);
        validatePaymentPending(payment);
        validateInvoicePendingConfirmation(invoice);

        if (receiptRepository.existsByInvoice_IdAndStatus(invoice.getId(), ReceiptStatus.VALID)) {
            throw new BadRequestException("A valid receipt already exists for this invoice");
        }

        LocalDateTime now = LocalDateTime.now();
        payment.setStatus(PaymentStatus.APPROVED);
        payment.setConfirmedBy(confirmedBy);
        payment.setConfirmedAt(now);
        updateDecisionNote(payment, request);

        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);
        receiptRepository.save(receiptCreationService.createValidReceipt(invoice, confirmedBy, now));
        activityLogService.record(
                confirmedBy,
                "PAYMENT_APPROVED",
                "Approved payment for invoice " + invoice.getId()
        );
        activityLogService.record(
                confirmedBy,
                "RECEIPT_CREATED",
                "System created receipt for invoice " + invoice.getId()
        );

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public PaymentResponse rejectPayment(
            Long paymentId,
            Long confirmedById,
            PaymentDecisionRequest request,
            Long buildingId
    ) {
        Payment payment = findPayment(paymentId);
        User confirmedBy = findUser(confirmedById);
        Invoice invoice = payment.getInvoice();

        validatePaymentBelongsToBuilding(payment, buildingId);
        validatePaymentPending(payment);
        validateInvoicePendingConfirmation(invoice);

        payment.setStatus(PaymentStatus.REJECTED);
        payment.setConfirmedBy(confirmedBy);
        payment.setConfirmedAt(LocalDateTime.now());
        updateDecisionNote(payment, request);

        invoice.setStatus(InvoiceStatus.REJECTED);
        invoiceRepository.save(invoice);
        activityLogService.record(
                confirmedBy,
                "PAYMENT_REJECTED",
                "Rejected payment for invoice " + invoice.getId()
        );

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    private void validateResidentInvoiceAccess(RoomAssignment assignment, Invoice invoice) {
        boolean sameRoom = invoice.getRoom().getId().equals(assignment.getRoom().getId());
        boolean sameResidentHead = invoice.getResidentHead().getId().equals(assignment.getResidentHead().getId());

        if (!sameRoom || !sameResidentHead) {
            throw new ForbiddenException("Invoice does not belong to the current Head Resident room");
        }
    }

    private void validateInvoiceCanReceivePayment(Invoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.UNPAID && invoice.getStatus() != InvoiceStatus.REJECTED) {
            throw new BadRequestException("Only unpaid or rejected invoices can receive payment proof");
        }

        if (paymentRepository.existsByInvoice_IdAndStatus(invoice.getId(), PaymentStatus.PENDING)) {
            throw new BadRequestException("This invoice already has a pending payment proof");
        }
    }

    private void validatePaymentPending(Payment payment) {
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException("Only pending payments can be processed");
        }
    }

    private void validateInvoicePendingConfirmation(Invoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.PENDING_CONFIRMATION) {
            throw new BadRequestException("Invoice is not pending payment confirmation");
        }
    }

    private void updateDecisionNote(Payment payment, PaymentDecisionRequest request) {
        if (request != null && request.getNote() != null && !request.getNote().isBlank()) {
            payment.setNote(request.getNote().trim());
        }
    }

    private String normalizeNote(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }

    private Payment findPayment(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    }

    private List<Payment> getBuildingPendingPayments(Long buildingId) {
        validateBuildingExists(buildingId);
        return paymentRepository.findByBuildingIdAndStatusWithDetails(buildingId, PaymentStatus.PENDING);
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validatePaymentBelongsToBuilding(Payment payment, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(payment.getInvoice().getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Payment does not belong to the selected building");
        }
    }

    private Invoice findInvoice(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private RoomAssignment findResidentAssignment(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Head Resident must have an active room"));
    }
}
