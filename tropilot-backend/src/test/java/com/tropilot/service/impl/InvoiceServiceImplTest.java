package com.tropilot.service.impl;

import com.tropilot.dto.request.InvoicePreviewRequest;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.PaymentStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.mapper.InvoiceMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.FeedbackRepository;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.PaymentRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.SepayPaymentRepository;
import com.tropilot.repository.ServiceFeeRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.repository.UtilityReadingRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.SepayPaymentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private BuildingRepository buildingRepository;
    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private RoomRepository roomRepository;
    @Mock
    private ReceiptRepository receiptRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RentalContractRepository rentalContractRepository;
    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;
    @Mock
    private UtilityReadingRepository utilityReadingRepository;
    @Mock
    private ServiceFeeRepository serviceFeeRepository;
    @Mock
    private RoomMemberRepository roomMemberRepository;
    @Mock
    private SepayPaymentRepository sepayPaymentRepository;
    @Mock
    private InvoiceMapper invoiceMapper;
    @Mock
    private SepayPaymentService sepayPaymentService;
    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private InvoiceServiceImpl service;

    @Test
    void generateInvoiceRejectsEmptyRoom() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.EMPTY);
        User admin = BusinessRuleTestFixtures.admin();
        InvoicePreviewRequest request = invoiceRequest(room.getId());

        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(roomRepository.findById(room.getId())).thenReturn(Optional.of(room));
        when(buildingRepository.existsById(room.getBuilding().getId())).thenReturn(true);

        assertThatThrownBy(() -> service.generateBuildingInvoice(
                room.getBuilding().getId(),
                request,
                admin.getId()
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("occupied rooms");

        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void generateFirstInvoiceIncludesDepositAndRoomRent() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        User admin = BusinessRuleTestFixtures.admin();
        RoomAssignment assignment = BusinessRuleTestFixtures.activeAssignment(room, residentHead);
        RentalContract contract = BusinessRuleTestFixtures.activeContract(room, residentHead);
        InvoicePreviewRequest request = invoiceRequest(room.getId());

        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(roomRepository.findById(room.getId())).thenReturn(Optional.of(room));
        when(buildingRepository.existsById(room.getBuilding().getId())).thenReturn(true);
        when(invoiceRepository.existsByRoom_IdAndMonth(room.getId(), LocalDate.of(2026, 6, 1))).thenReturn(false);
        when(roomAssignmentRepository.findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(Optional.of(assignment));
        when(invoiceRepository.existsByRoom_IdAndResidentHead_Id(room.getId(), residentHead.getId()))
                .thenReturn(false);
        when(rentalContractRepository.findFirstByRoom_IdAndResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(
                room.getId(),
                residentHead.getId(),
                RentalStatus.ACTIVE
        )).thenReturn(Optional.of(contract));
        when(serviceFeeRepository.findByBuilding_IdAndIsActiveTrueOrderByCreatedAtDesc(room.getBuilding().getId()))
                .thenReturn(List.of());
        when(roomMemberRepository.countByRoom_IdAndResidentHead_IdAndStatus(
                room.getId(),
                residentHead.getId(),
                RoomMemberStatus.APPROVED
        )).thenReturn(0L);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice invoice = invocation.getArgument(0);
            invoice.setId(300L);
            return invoice;
        });
        when(sepayPaymentService.createForInvoice(any(Invoice.class))).thenReturn(Optional.empty());
        when(invoiceMapper.toResponse(any(Invoice.class), isNull(), isNull(), isNull()))
                .thenReturn(InvoiceResponse.builder().id(300L).build());

        InvoiceResponse response = service.generateBuildingInvoice(
                room.getBuilding().getId(),
                request,
                admin.getId()
        );

        assertThat(response.getId()).isEqualTo(300L);
        ArgumentCaptor<Invoice> invoiceCaptor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(invoiceCaptor.capture());
        Invoice savedInvoice = invoiceCaptor.getValue();
        assertThat(savedInvoice.getItems())
                .extracting(item -> item.getItemName())
                .containsExactly("Deposit", "Room rent");
        assertThat(savedInvoice.getTotalAmount())
                .isEqualByComparingTo(new BigDecimal("10000000"));
    }

    @Test
    void deleteInvoiceAllowsPendingConfirmationWithoutApprovedPaymentOrReceipt() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        User admin = BusinessRuleTestFixtures.admin();
        Invoice invoice = BusinessRuleTestFixtures.invoice(
                room,
                residentHead,
                admin,
                InvoiceStatus.PENDING_CONFIRMATION
        );

        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(invoiceRepository.findById(invoice.getId())).thenReturn(Optional.of(invoice));
        when(buildingRepository.existsById(room.getBuilding().getId())).thenReturn(true);
        when(receiptRepository.existsByInvoice_Id(invoice.getId())).thenReturn(false);
        when(paymentRepository.existsByInvoice_IdAndStatus(invoice.getId(), PaymentStatus.APPROVED))
                .thenReturn(false);
        when(feedbackRepository.findByInvoice_Id(invoice.getId())).thenReturn(List.of());

        service.deleteBuildingInvoice(room.getBuilding().getId(), invoice.getId(), admin.getId());

        verify(paymentRepository).deleteByInvoice_Id(invoice.getId());
        verify(sepayPaymentRepository).deleteByInvoice_Id(invoice.getId());
        verify(invoiceRepository).delete(invoice);
    }

    @Test
    void deleteInvoiceRejectsPaidInvoice() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        User admin = BusinessRuleTestFixtures.admin();
        Invoice invoice = BusinessRuleTestFixtures.invoice(room, residentHead, admin, InvoiceStatus.PAID);

        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(invoiceRepository.findById(invoice.getId())).thenReturn(Optional.of(invoice));
        when(buildingRepository.existsById(room.getBuilding().getId())).thenReturn(true);

        assertThatThrownBy(() -> service.deleteBuildingInvoice(
                room.getBuilding().getId(),
                invoice.getId(),
                admin.getId()
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only unpaid");

        verify(invoiceRepository, never()).delete(any());
    }

    private InvoicePreviewRequest invoiceRequest(Long roomId) {
        InvoicePreviewRequest request = new InvoicePreviewRequest();
        request.setRoomId(roomId);
        request.setInvoiceDate(LocalDate.of(2026, 6, 3));
        request.setDueDate(LocalDate.of(2026, 6, 5));
        return request;
    }
}
