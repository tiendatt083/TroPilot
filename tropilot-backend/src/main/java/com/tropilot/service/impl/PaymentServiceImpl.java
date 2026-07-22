package com.tropilot.service.impl;

import com.tropilot.storage.PaymentProofStorageService;
import com.tropilot.mapper.PaymentMapper;
import com.tropilot.dto.request.PaymentUploadRequest;
import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Payment;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.PaymentStatus;
import com.tropilot.enums.NotificationEventType;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.PaymentRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.PaymentService;
import com.tropilot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final BuildingRepository buildingRepository;
    private final InvoiceRepository invoiceRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final PaymentProofStorageService paymentProofStorageService;
    private final PaymentMapper paymentMapper;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

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
        notificationService.notifyAdmins(
                assignment.getResidentHead(),
                NotificationEventType.PAYMENT_SUBMITTED,
                "Có thanh toán cần xác nhận",
                assignment.getResidentHead().getFullName()
                        + " đã gửi minh chứng thanh toán hóa đơn " + invoice.getId()
                        + " của phòng " + invoice.getRoom().getRoomCode() + ".",
                "/admin/buildings/" + invoice.getRoom().getBuilding().getId() + "/invoices",
                invoice.getRoom().getBuilding()
        );

        return paymentMapper.toResponse(savedPayment);
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

    private String normalizeNote(String note) {
        return note == null || note.isBlank() ? null : note.trim();
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

    private Invoice findInvoice(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }

    private RoomAssignment findResidentAssignment(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Head Resident must have an active room"));
    }
}
