package com.tropilot.service.impl;

import com.tropilot.mapper.InvoiceMapper;
import com.tropilot.dto.request.BulkInvoiceRequest;
import com.tropilot.dto.request.InvoicePreviewRequest;
import com.tropilot.dto.response.BulkInvoicePreviewResponse;
import com.tropilot.dto.response.InvoiceBulkBlockedRoomResponse;
import com.tropilot.dto.response.InvoiceItemResponse;
import com.tropilot.dto.response.InvoicePreviewResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Feedback;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.InvoiceItem;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.ServiceFee;
import com.tropilot.entity.SepayPayment;
import com.tropilot.entity.User;
import com.tropilot.entity.UtilityReading;
import com.tropilot.enums.CalculationType;
import com.tropilot.enums.FeedbackType;
import com.tropilot.enums.FeeType;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.PaymentStatus;
import com.tropilot.enums.ReceiptStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.FeedbackRepository;
import com.tropilot.repository.PaymentRepository;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.SepayPaymentRepository;
import com.tropilot.repository.ServiceFeeRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.repository.UtilityReadingRepository;
import com.tropilot.repository.VehicleRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.InvoiceService;
import com.tropilot.service.PaymentEmailService;
import com.tropilot.service.SepayPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
/** Tính toán, xem trước, phát hành, tra cứu và xóa hóa đơn theo các quy tắc thu phí của tòa nhà. */
public class InvoiceServiceImpl implements InvoiceService {

    private static final BigDecimal ONE = BigDecimal.ONE;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final String BLOCKED_ALREADY_INVOICED = "ALREADY_INVOICED";
    private static final String BLOCKED_ROOM_NOT_OCCUPIED = "ROOM_NOT_OCCUPIED";
    private static final String BLOCKED_NO_ACTIVE_HEAD_RESIDENT = "NO_ACTIVE_HEAD_RESIDENT";
    private static final String BLOCKED_MISSING_UTILITY_READING = "MISSING_UTILITY_READING";
    private static final String BLOCKED_INVALID_CONFIGURATION = "INVALID_CONFIGURATION";

    private final InvoiceRepository invoiceRepository;
    private final BuildingRepository buildingRepository;
    private final FeedbackRepository feedbackRepository;
    private final PaymentRepository paymentRepository;
    private final RoomRepository roomRepository;
    private final ReceiptRepository receiptRepository;
    private final UserRepository userRepository;
    private final RentalContractRepository rentalContractRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final UtilityReadingRepository utilityReadingRepository;
    private final ServiceFeeRepository serviceFeeRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final VehicleRepository vehicleRepository;
    private final SepayPaymentRepository sepayPaymentRepository;
    private final InvoiceMapper invoiceMapper;
    private final SepayPaymentService sepayPaymentService;
    private final PaymentEmailService paymentEmailService;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional(readOnly = true)
    /** Tính thử hóa đơn cho một phòng trong tòa nhà nhưng chưa lưu vào cơ sở dữ liệu. */
    public InvoicePreviewResponse previewBuildingInvoice(Long buildingId, InvoicePreviewRequest request) {
        InvoiceCalculation calculation = calculateInvoice(
                findRoom(request.getRoomId()),
                buildingId,
                request.getInvoiceDate(),
                request.getDueDate(),
                request.getAdditionalChargeAmount(),
                request.getAdditionalChargeNote(),
                true
        );

        return toPreviewResponse(calculation);
    }

    @Override
    @Transactional
    /** Tính, tạo và lưu hóa đơn chính thức cho một phòng, sau đó tạo thông tin thanh toán nếu áp dụng. */
    public InvoiceResponse generateBuildingInvoice(Long buildingId, InvoicePreviewRequest request, Long createdById) {
        User createdBy = findUser(createdById);
        InvoiceCalculation calculation = calculateInvoice(
                findRoom(request.getRoomId()),
                buildingId,
                request.getInvoiceDate(),
                request.getDueDate(),
                request.getAdditionalChargeAmount(),
                request.getAdditionalChargeNote(),
                true
        );

        return saveInvoice(calculation, createdBy);
    }

    @Override
    @Transactional(readOnly = true)
    /** Xem trước hóa đơn hàng loạt và trả cả những phòng bị chặn cùng lý do không thể tạo. */
    public BulkInvoicePreviewResponse previewBuildingInvoices(Long buildingId, BulkInvoiceRequest request) {
        Building building = findBuilding(buildingId);
        LocalDate invoiceMonth = getInvoiceMonth(request.getInvoiceDate());
        LocalDate utilityMonth = invoiceMonth.minusMonths(1);
        List<Room> rooms = roomRepository.findByFilters(buildingId, null, null)
                .stream()
                .sorted(Comparator.comparing(Room::getRoomCode))
                .toList();
        Map<Long, RoomAssignment> activeAssignments = roomAssignmentRepository
                .findByBuildingIdAndStatusWithDetails(buildingId, RoomAssignmentStatus.ACTIVE)
                .stream()
                .collect(Collectors.toMap(
                        assignment -> assignment.getRoom().getId(),
                        Function.identity()
                ));

        List<InvoicePreviewResponse> eligibleInvoices = new ArrayList<>();
        List<InvoiceBulkBlockedRoomResponse> blockedRooms = new ArrayList<>();

        for (Room room : rooms) {
            if (room.getStatus() != RoomStatus.OCCUPIED) {
                blockedRooms.add(toBlockedRoom(room, BLOCKED_ROOM_NOT_OCCUPIED, "Only occupied rooms can receive invoices"));
                continue;
            }

            RoomAssignment assignment = activeAssignments.get(room.getId());
            if (assignment == null) {
                blockedRooms.add(toBlockedRoom(room, BLOCKED_NO_ACTIVE_HEAD_RESIDENT, "Room has no active Head Resident"));
                continue;
            }

            if (invoiceRepository.existsByRoom_IdAndMonth(room.getId(), invoiceMonth)) {
                blockedRooms.add(toBlockedRoom(room, BLOCKED_ALREADY_INVOICED, "Invoice already exists for this room and month"));
                continue;
            }

            try {
                InvoiceCalculation calculation = calculateInvoice(
                        room,
                        buildingId,
                        request.getInvoiceDate(),
                        request.getDueDate(),
                        BigDecimal.ZERO,
                        null,
                        false
                );
                eligibleInvoices.add(toPreviewResponse(calculation));
            } catch (BadRequestException exception) {
                String reasonCode = exception.getMessage().toLowerCase().contains("utility reading")
                        ? BLOCKED_MISSING_UTILITY_READING
                        : BLOCKED_INVALID_CONFIGURATION;
                blockedRooms.add(toBlockedRoom(room, reasonCode, exception.getMessage()));
            }
        }

        BigDecimal totalAmount = eligibleInvoices.stream()
                .map(InvoicePreviewResponse::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return BulkInvoicePreviewResponse.builder()
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .invoiceDate(request.getInvoiceDate())
                .invoiceMonth(invoiceMonth.format(MONTH_FORMATTER))
                .utilityMonth(utilityMonth.format(MONTH_FORMATTER))
                .dueDate(request.getDueDate())
                .eligibleCount(eligibleInvoices.size())
                .blockedCount(blockedRooms.size())
                .totalAmount(totalAmount)
                .eligibleInvoices(eligibleInvoices)
                .blockedRooms(blockedRooms)
                .build();
    }

    @Override
    @Transactional
    /** Phát hành hóa đơn cho nhiều phòng đủ điều kiện trong cùng một tòa nhà. */
    public List<InvoiceResponse> generateBuildingInvoices(Long buildingId, BulkInvoiceRequest request, Long createdById) {
        User createdBy = findUser(createdById);
        BulkInvoicePreviewResponse preview = previewBuildingInvoices(buildingId, request);

        boolean hasFatalBlock = preview.getBlockedRooms()
                .stream()
                .anyMatch(room -> BLOCKED_MISSING_UTILITY_READING.equals(room.getReasonCode())
                        || BLOCKED_INVALID_CONFIGURATION.equals(room.getReasonCode()));

        if (hasFatalBlock) {
            throw new BadRequestException("Bulk invoice generation requires valid billing configuration and required utility readings");
        }

        if (preview.getEligibleInvoices().isEmpty()) {
            throw new BadRequestException("No room is eligible for bulk invoice generation");
        }

        return preview.getEligibleInvoices()
                .stream()
                .map(previewInvoice -> {
                    InvoiceCalculation calculation = calculateInvoice(
                            findRoom(previewInvoice.getRoomId()),
                            buildingId,
                            request.getInvoiceDate(),
                            request.getDueDate(),
                            BigDecimal.ZERO,
                            null,
                            true
                    );
                    return saveInvoice(calculation, createdBy);
                })
                .toList();
    }

    @Override
    @Transactional
    /** Xóa hóa đơn thuộc tòa nhà khi trạng thái cho phép, đồng thời xử lý dữ liệu thanh toán liên quan. */
    public void deleteBuildingInvoice(Long buildingId, Long invoiceId, Long deletedById) {
        User deletedBy = findUser(deletedById);
        Invoice invoice = findInvoice(invoiceId);
        validateInvoiceBelongsToBuilding(invoice, buildingId);

        if (!canDeleteInvoice(invoice.getStatus())) {
            throw new BadRequestException("Only unpaid, pending confirmation, overdue, or rejected invoices can be deleted");
        }

        if (receiptRepository.existsByInvoice_IdAndStatus(invoiceId, ReceiptStatus.VALID)
                || paymentRepository.existsByInvoice_IdAndStatus(invoiceId, PaymentStatus.APPROVED)) {
            throw new BadRequestException("Invoice cannot be deleted because it has an approved payment or valid receipt");
        }

        List<Feedback> invoiceFeedbacks = feedbackRepository.findByInvoice_Id(invoiceId);
        invoiceFeedbacks.forEach(feedback -> feedback.setInvoice(null));
        feedbackRepository.saveAll(invoiceFeedbacks);

        String roomCode = invoice.getRoom().getRoomCode();
        String invoiceMonth = invoice.getMonth().format(MONTH_FORMATTER);
        paymentRepository.deleteByInvoice_Id(invoiceId);
        sepayPaymentRepository.deleteByInvoice_Id(invoiceId);
        invoiceRepository.delete(invoice);
        activityLogService.record(
                deletedBy,
                "INVOICE_DELETED",
                "Deleted invoice for room " + roomCode + " and month " + invoiceMonth
        );
    }

    private boolean canDeleteInvoice(InvoiceStatus status) {
        return status == InvoiceStatus.UNPAID
                || status == InvoiceStatus.PENDING_CONFIRMATION
                || status == InvoiceStatus.OVERDUE
                || status == InvoiceStatus.REJECTED;
    }

    @Override
    @Transactional(readOnly = true)
    /** Lấy danh sách hóa đơn trong phạm vi một tòa nhà. */
    public List<InvoiceResponse> getBuildingInvoices(Long buildingId) {
        return findBuildingInvoices(buildingId)
                .stream()
                .map(invoice -> invoiceMapper.toResponse(
                        invoice,
                        findUtilityReadingForInvoice(invoice),
                        findInvoiceComplaint(invoice),
                        findSepayPayment(invoice)
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    /** Lấy chi tiết hóa đơn sau khi xác nhận hóa đơn thuộc tòa nhà được yêu cầu. */
    public InvoiceResponse getBuildingInvoice(Long buildingId, Long invoiceId) {
        Invoice invoice = findInvoice(invoiceId);
        validateInvoiceBelongsToBuilding(invoice, buildingId);
        return invoiceMapper.toResponse(
                invoice,
                findUtilityReadingForInvoice(invoice),
                findInvoiceComplaint(invoice),
                findSepayPayment(invoice)
        );
    }

    @Override
    @Transactional(readOnly = true)
    /** Lấy hóa đơn mà chủ hộ có thể xem theo phân phòng hiện tại. */
    public List<InvoiceResponse> getResidentInvoices(Long residentHeadId) {
        RoomAssignment assignment = findResidentAssignment(residentHeadId);

        return invoiceRepository.findByRoomIdWithDetails(assignment.getRoom().getId())
                .stream()
                .map(invoice -> invoiceMapper.toResponse(
                        invoice,
                        findUtilityReadingForInvoice(invoice),
                        findInvoiceComplaint(invoice),
                        findSepayPayment(invoice)
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    /** Lấy một hóa đơn khi hóa đơn đó thực sự thuộc chủ hộ đang đăng nhập. */
    public InvoiceResponse getResidentInvoice(Long residentHeadId, Long id) {
        RoomAssignment assignment = findResidentAssignment(residentHeadId);
        Invoice invoice = findInvoice(id);

        if (!invoice.getRoom().getId().equals(assignment.getRoom().getId())) {
            throw new ForbiddenException("Invoice does not belong to the current Head Resident room");
        }

        return invoiceMapper.toResponse(
                invoice,
                findUtilityReadingForInvoice(invoice),
                findInvoiceComplaint(invoice),
                findSepayPayment(invoice)
        );
    }

    private InvoiceCalculation calculateInvoice(
            Room room,
            Long buildingId,
            LocalDate invoiceDate,
            LocalDate dueDate,
            BigDecimal additionalChargeAmount,
            String additionalChargeNote,
            boolean validateDuplicate
    ) {
        LocalDate invoiceMonth = getInvoiceMonth(invoiceDate);
        validateRoomBelongsToBuilding(room, buildingId);
        validateRoomCanReceiveInvoice(room);

        if (validateDuplicate && invoiceRepository.existsByRoom_IdAndMonth(room.getId(), invoiceMonth)) {
            throw new BadRequestException("Invoice already exists for this room and month");
        }

        RoomAssignment assignment = roomAssignmentRepository
                .findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Only rooms with an active Head Resident can receive invoices"));

        boolean firstInvoiceForCurrentHead = !invoiceRepository.existsByRoom_IdAndResidentHead_Id(
                room.getId(),
                assignment.getResidentHead().getId()
        );
        RentalContract activeContract = firstInvoiceForCurrentHead ? findActiveContract(assignment) : null;
        List<ServiceFee> activeFees = serviceFeeRepository
                .findByBuilding_IdAndIsActiveTrueOrderByCreatedAtDesc(room.getBuilding().getId());
        long approvedMemberCount = roomMemberRepository.countByRoom_IdAndResidentHead_IdAndStatus(
                room.getId(),
                assignment.getResidentHead().getId(),
                RoomMemberStatus.APPROVED
        );
        BigDecimal occupantQuantity = BigDecimal.valueOf(1L + approvedMemberCount);
        BigDecimal activeVehicleQuantity = BigDecimal.valueOf(
                vehicleRepository.countByRoom_IdAndStatus(room.getId(), VehicleStatus.ACTIVE)
        );
        boolean utilityReadingRequired = !firstInvoiceForCurrentHead && hasUsageBasedUtilityFee(activeFees);
        LocalDate utilityMonth = invoiceMonth.minusMonths(1);
        UtilityReading utilityReading = findUtilityReadingForGeneration(room, utilityMonth, utilityReadingRequired);

        Invoice draftInvoice = Invoice.builder()
                .room(room)
                .residentHead(assignment.getResidentHead())
                .invoiceDate(invoiceDate)
                .month(invoiceMonth)
                .dueDate(dueDate)
                .status(InvoiceStatus.UNPAID)
                .totalAmount(BigDecimal.ZERO)
                .build();

        if (firstInvoiceForCurrentHead) {
            addDepositItem(draftInvoice, activeContract.getDepositAmount());
        }
        addRoomPriceItem(draftInvoice, room);
        if (!firstInvoiceForCurrentHead) {
            addUtilityItem(draftInvoice, activeFees, utilityReading, FeeType.ELECTRICITY, occupantQuantity);
            addUtilityItem(draftInvoice, activeFees, utilityReading, FeeType.WATER, occupantQuantity);
        }
        addFixedFeeItems(draftInvoice, activeFees);
        addByPersonFeeItems(draftInvoice, activeFees, occupantQuantity);
        addByVehicleFeeItems(draftInvoice, activeFees, activeVehicleQuantity);
        addAdditionalChargeItem(draftInvoice, additionalChargeAmount, additionalChargeNote);

        BigDecimal totalAmount = draftInvoice.getItems()
                .stream()
                .map(InvoiceItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Invoice total amount must not be negative");
        }

        draftInvoice.setTotalAmount(totalAmount);

        return new InvoiceCalculation(
                room,
                assignment,
                invoiceDate,
                invoiceMonth,
                utilityMonth,
                dueDate,
                firstInvoiceForCurrentHead,
                utilityReadingRequired,
                utilityReading,
                draftInvoice.getItems(),
                totalAmount
        );
    }

    private InvoiceResponse saveInvoice(InvoiceCalculation calculation, User createdBy) {
        Invoice invoice = Invoice.builder()
                .room(calculation.room())
                .residentHead(calculation.assignment().getResidentHead())
                .invoiceDate(calculation.invoiceDate())
                .month(calculation.invoiceMonth())
                .dueDate(calculation.dueDate())
                .status(InvoiceStatus.UNPAID)
                .createdBy(createdBy)
                .totalAmount(calculation.totalAmount())
                .build();

        calculation.items().forEach(invoice::addItem);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        activityLogService.record(
                createdBy,
                "INVOICE_GENERATED",
                "Generated invoice for room " + calculation.room().getRoomCode()
                        + " and month " + calculation.invoiceMonth().format(MONTH_FORMATTER)
        );

        SepayPayment sepayPayment = sepayPaymentService.createForInvoice(savedInvoice).orElse(null);
        paymentEmailService.sendInvoiceIssuedEmail(savedInvoice, sepayPayment);
        return invoiceMapper.toResponse(savedInvoice, calculation.utilityReading(), findInvoiceComplaint(savedInvoice), sepayPayment);
    }

    private InvoicePreviewResponse toPreviewResponse(InvoiceCalculation calculation) {
        Room room = calculation.room();
        Building building = room.getBuilding();
        User residentHead = calculation.assignment().getResidentHead();
        List<String> warnings = new ArrayList<>();

        if (calculation.firstInvoiceForCurrentHead()) {
            warnings.add("First invoice includes the deposit and excludes usage-based utility charges");
        }

        if (calculation.utilityReadingRequired()) {
            warnings.add("Usage-based electricity or water uses the previous month utility reading");
        }

        return InvoicePreviewResponse.builder()
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .invoiceDate(calculation.invoiceDate())
                .invoiceMonth(calculation.invoiceMonth().format(MONTH_FORMATTER))
                .utilityMonth(calculation.utilityMonth().format(MONTH_FORMATTER))
                .dueDate(calculation.dueDate())
                .firstInvoiceForCurrentHead(calculation.firstInvoiceForCurrentHead())
                .depositIncluded(hasDepositItem(calculation.items()))
                .utilityReadingRequired(calculation.utilityReadingRequired())
                .totalAmount(calculation.totalAmount())
                .items(calculation.items().stream().map(this::toItemResponse).toList())
                .warnings(warnings)
                .build();
    }

    private InvoiceItemResponse toItemResponse(InvoiceItem item) {
        ServiceFee serviceFee = item.getServiceFee();

        return InvoiceItemResponse.builder()
                .serviceFeeId(serviceFee == null ? null : serviceFee.getId())
                .itemName(item.getItemName())
                .calculationType(serviceFee == null ? null : serviceFee.getCalculationType().name())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .amount(item.getAmount())
                .note(item.getNote())
                .build();
    }

    private InvoiceBulkBlockedRoomResponse toBlockedRoom(Room room, String reasonCode, String reason) {
        return InvoiceBulkBlockedRoomResponse.builder()
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .residentHeadName(findActiveResidentHeadName(room))
                .reasonCode(reasonCode)
                .reason(reason)
                .build();
    }

    private String findActiveResidentHeadName(Room room) {
        return roomAssignmentRepository
                .findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE)
                .map(RoomAssignment::getResidentHead)
                .map(User::getFullName)
                .orElse(null);
    }

    private boolean hasDepositItem(List<InvoiceItem> items) {
        return items.stream().anyMatch(item -> "Deposit".equals(item.getItemName()));
    }

    private void addRoomPriceItem(Invoice invoice, Room room) {
        invoice.addItem(InvoiceItem.builder()
                .itemName("Room rent")
                .quantity(ONE)
                .unitPrice(room.getPrice())
                .amount(room.getPrice())
                .note("Monthly room price")
                .build());
    }

    private void addDepositItem(Invoice invoice, BigDecimal depositAmount) {
        if (depositAmount == null || depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        invoice.addItem(InvoiceItem.builder()
                .itemName("Deposit")
                .quantity(ONE)
                .unitPrice(depositAmount)
                .amount(depositAmount)
                .note("Initial refundable deposit")
                .build());
    }

    private void addAdditionalChargeItem(Invoice invoice, BigDecimal additionalChargeAmount, String additionalChargeNote) {
        if (additionalChargeAmount == null || additionalChargeAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        String note = additionalChargeNote == null || additionalChargeNote.isBlank()
                ? "Extra room charge"
                : additionalChargeNote.trim();

        invoice.addItem(InvoiceItem.builder()
                .itemName("Additional charge")
                .quantity(ONE)
                .unitPrice(additionalChargeAmount)
                .amount(additionalChargeAmount)
                .note(note)
                .build());
    }

    private void addUtilityItem(
            Invoice invoice,
            List<ServiceFee> activeFees,
            UtilityReading utilityReading,
            FeeType feeType,
            BigDecimal occupantQuantity
    ) {
        ServiceFee serviceFee = findRequiredFee(activeFees, feeType);

        if (serviceFee.getCalculationType() == CalculationType.BY_USAGE) {
            if (utilityReading == null) {
                throw new BadRequestException("Utility reading is required for usage-based electricity or water fees");
            }

            BigDecimal usage = feeType == FeeType.ELECTRICITY
                    ? utilityReading.getNewElectricity().subtract(utilityReading.getOldElectricity())
                    : utilityReading.getNewWater().subtract(utilityReading.getOldWater());

            addServiceFeeItem(
                    invoice,
                    serviceFee,
                    usage,
                    feeType == FeeType.ELECTRICITY ? "Electricity usage" : "Water usage"
            );
            return;
        }

        if (serviceFee.getCalculationType() == CalculationType.BY_PERSON) {
            addServiceFeeItem(
                    invoice,
                    serviceFee,
                    occupantQuantity,
                    feeType == FeeType.ELECTRICITY ? "Electricity charged by occupant" : "Water charged by occupant"
            );
            return;
        }

        if (serviceFee.getCalculationType() == CalculationType.FIXED) {
            addServiceFeeItem(
                    invoice,
                    serviceFee,
                    ONE,
                    feeType == FeeType.ELECTRICITY ? "Electricity fixed by room" : "Water fixed by room"
            );
            return;
        }

        throw new BadRequestException("Electricity and water fees must be fixed, calculated by usage, or calculated by person");
    }

    private void addFixedFeeItems(Invoice invoice, List<ServiceFee> activeFees) {
        activeFees.stream()
                .filter(fee -> fee.getCalculationType() == CalculationType.FIXED)
                .filter(fee -> fee.getFeeType() == FeeType.OTHER)
                .forEach(fee -> addServiceFeeItem(invoice, fee, ONE, "Other fixed service fee"));
    }

    private void addByPersonFeeItems(
            Invoice invoice,
            List<ServiceFee> activeFees,
            BigDecimal occupantQuantity
    ) {
        activeFees.stream()
                .filter(fee -> fee.getFeeType() == FeeType.OTHER)
                .filter(fee -> fee.getCalculationType() == CalculationType.BY_PERSON)
                .forEach(fee -> addServiceFeeItem(invoice, fee, occupantQuantity, "Head Resident plus approved room members"));
    }

    private void addByVehicleFeeItems(
            Invoice invoice,
            List<ServiceFee> activeFees,
            BigDecimal activeVehicleQuantity
    ) {
        if (activeVehicleQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        activeFees.stream()
                .filter(fee -> fee.getFeeType() == FeeType.OTHER)
                .filter(fee -> fee.getCalculationType() == CalculationType.BY_QUANTITY)
                .forEach(fee -> addServiceFeeItem(invoice, fee, activeVehicleQuantity, "Active registered vehicles in this room"));
    }

    private void addServiceFeeItem(
            Invoice invoice,
            ServiceFee serviceFee,
            BigDecimal quantity,
            String note
    ) {
        BigDecimal amount = serviceFee.getUnitPrice().multiply(quantity);

        invoice.addItem(InvoiceItem.builder()
                .serviceFee(serviceFee)
                .itemName(serviceFee.getName())
                .quantity(quantity)
                .unitPrice(serviceFee.getUnitPrice())
                .amount(amount)
                .note(note)
                .build());
    }

    private ServiceFee findRequiredFee(List<ServiceFee> activeFees, FeeType feeType) {
        List<ServiceFee> matchingFees = activeFees.stream()
                .filter(fee -> fee.getFeeType() == feeType)
                .toList();

        if (matchingFees.isEmpty()) {
            throw new BadRequestException(
                    "Active " + feeType.name().toLowerCase() + " fee is required in this building for invoice generation"
            );
        }

        if (matchingFees.size() > 1) {
            throw new BadRequestException(
                    "Multiple active " + feeType.name().toLowerCase()
                            + " fees were found in this building. Deactivate duplicates before generating invoices"
            );
        }

        return matchingFees.get(0);
    }

    private boolean hasUsageBasedUtilityFee(List<ServiceFee> activeFees) {
        return activeFees.stream()
                .filter(fee -> fee.getFeeType() == FeeType.ELECTRICITY || fee.getFeeType() == FeeType.WATER)
                .anyMatch(fee -> fee.getCalculationType() == CalculationType.BY_USAGE);
    }

    private Invoice findInvoice(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }

    private List<Invoice> findBuildingInvoices(Long buildingId) {
        validateBuildingExists(buildingId);
        return invoiceRepository.findByBuildingIdWithDetails(buildingId);
    }

    private Building findBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found"));
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validateRoomBelongsToBuilding(Room room, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(room.getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Selected room does not belong to the selected building");
        }
    }

    private void validateInvoiceBelongsToBuilding(Invoice invoice, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(invoice.getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Invoice does not belong to the selected building");
        }
    }

    private void validateRoomCanReceiveInvoice(Room room) {
        if (room.getStatus() != RoomStatus.OCCUPIED) {
            throw new BadRequestException("Only occupied rooms can receive invoices");
        }
    }

    private Room findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
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

    private UtilityReading findUtilityReadingForInvoice(Invoice invoice) {
        if (!invoiceUsesUsageBasedUtility(invoice)) {
            return null;
        }

        return utilityReadingRepository
                .findByRoomIdAndMonthWithDetails(invoice.getRoom().getId(), invoice.getMonth().minusMonths(1))
                .orElse(null);
    }

    private boolean invoiceUsesUsageBasedUtility(Invoice invoice) {
        return invoice.getItems()
                .stream()
                .map(InvoiceItem::getServiceFee)
                .filter(Objects::nonNull)
                .filter(fee -> fee.getFeeType() == FeeType.ELECTRICITY || fee.getFeeType() == FeeType.WATER)
                .anyMatch(fee -> fee.getCalculationType() == CalculationType.BY_USAGE);
    }

    private UtilityReading findUtilityReadingForGeneration(
            Room room,
            LocalDate utilityMonth,
            boolean utilityReadingRequired
    ) {
        return utilityReadingRepository
                .findByRoomIdAndMonthWithDetails(room.getId(), utilityMonth)
                .orElseGet(() -> {
                    if (!utilityReadingRequired) {
                        return null;
                    }

                    throw new BadRequestException("Utility reading is required for this room and previous month");
                });
    }

    private RentalContract findActiveContract(RoomAssignment assignment) {
        return rentalContractRepository
                .findFirstByRoom_IdAndResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(
                        assignment.getRoom().getId(),
                        assignment.getResidentHead().getId(),
                        RentalStatus.ACTIVE
                )
                .orElseThrow(() -> new BadRequestException("Active rental contract is required for the first invoice"));
    }

    private LocalDate getInvoiceMonth(LocalDate invoiceDate) {
        if (invoiceDate == null) {
            throw new BadRequestException("Invoice date is required");
        }

        return YearMonth.from(invoiceDate).atDay(1);
    }

    private Feedback findInvoiceComplaint(Invoice invoice) {
        if (invoice.getId() == null) {
            return null;
        }

        return feedbackRepository
                .findFirstByInvoice_IdAndTypeOrderByCreatedAtDesc(invoice.getId(), FeedbackType.INVOICE_COMPLAINT)
                .orElse(null);
    }

    private SepayPayment findSepayPayment(Invoice invoice) {
        if (invoice.getId() == null) {
            return null;
        }

        return sepayPaymentService.findByInvoiceId(invoice.getId()).orElse(null);
    }

    private record InvoiceCalculation(
            Room room,
            RoomAssignment assignment,
            LocalDate invoiceDate,
            LocalDate invoiceMonth,
            LocalDate utilityMonth,
            LocalDate dueDate,
            boolean firstInvoiceForCurrentHead,
            boolean utilityReadingRequired,
            UtilityReading utilityReading,
            List<InvoiceItem> items,
            BigDecimal totalAmount
    ) {
    }
}
