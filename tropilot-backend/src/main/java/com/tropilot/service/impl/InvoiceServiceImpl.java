package com.tropilot.service.impl;

import com.tropilot.dto.request.InvoiceGenerateRequest;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.InvoiceItem;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.ServiceFee;
import com.tropilot.entity.User;
import com.tropilot.entity.UtilityReading;
import com.tropilot.entity.Vehicle;
import com.tropilot.enums.CalculationType;
import com.tropilot.enums.FeeType;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.ServiceFeeRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.repository.UtilityReadingRepository;
import com.tropilot.repository.VehicleRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private static final BigDecimal ONE = BigDecimal.ONE;

    private final InvoiceRepository invoiceRepository;
    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RentalContractRepository rentalContractRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final UtilityReadingRepository utilityReadingRepository;
    private final ServiceFeeRepository serviceFeeRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final VehicleRepository vehicleRepository;
    private final InvoiceMapper invoiceMapper;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public InvoiceResponse generateInvoice(InvoiceGenerateRequest request, Long createdById) {
        Room room = findRoom(request.getRoomId());
        validateRoomBelongsToBuilding(room, request.getBuildingId());
        User createdBy = findUser(createdById);
        LocalDate month = parseMonth(request.getMonth());

        if (invoiceRepository.existsByRoom_IdAndMonth(room.getId(), month)) {
            throw new BadRequestException("Invoice already exists for this room and month");
        }

        RoomAssignment assignment = roomAssignmentRepository
                .findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Only rooms with an active Head Resident can receive invoices"));

        boolean firstInvoiceForCurrentHead = !invoiceRepository.existsByRoom_IdAndResidentHead_Id(
                room.getId(),
                assignment.getResidentHead().getId()
        );
        UtilityReading utilityReading = findUtilityReadingForGeneration(room, month, firstInvoiceForCurrentHead);
        RentalContract activeContract = firstInvoiceForCurrentHead ? findActiveContract(assignment) : null;

        List<ServiceFee> activeFees = serviceFeeRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        long approvedMemberCount = roomMemberRepository.countByRoom_IdAndResidentHead_IdAndStatus(
                room.getId(),
                assignment.getResidentHead().getId(),
                RoomMemberStatus.APPROVED
        );
        BigDecimal occupantQuantity = BigDecimal.valueOf(1L + approvedMemberCount);
        List<Vehicle> activeVehicles = vehicleRepository.findByRoomIdAndStatusWithDetails(room.getId(), VehicleStatus.ACTIVE);

        Invoice invoice = Invoice.builder()
                .room(room)
                .residentHead(assignment.getResidentHead())
                .month(month)
                .dueDate(request.getDueDate())
                .status(InvoiceStatus.UNPAID)
                .createdBy(createdBy)
                .totalAmount(BigDecimal.ZERO)
                .build();

        if (firstInvoiceForCurrentHead) {
            addDepositItem(invoice, activeContract.getDepositAmount());
        }
        addRoomPriceItem(invoice, room);
        if (!firstInvoiceForCurrentHead) {
            addUtilityItem(invoice, activeFees, utilityReading, FeeType.ELECTRICITY);
            addUtilityItem(invoice, activeFees, utilityReading, FeeType.WATER);
        }
        addFixedFeeItems(invoice, activeFees);
        addByPersonFeeItems(invoice, activeFees, occupantQuantity);
        addParkingFeeItems(invoice, activeFees, activeVehicles);

        BigDecimal totalAmount = invoice.getItems()
                .stream()
                .map(InvoiceItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Invoice total amount must not be negative");
        }

        invoice.setTotalAmount(totalAmount);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        activityLogService.record(
                createdBy,
                "INVOICE_GENERATED",
                "Generated invoice for room " + room.getRoomCode() + " and month " + month
        );

        return invoiceMapper.toResponse(savedInvoice, utilityReading);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoices(Long buildingId) {
        List<Invoice> invoices = buildingId == null
                ? invoiceRepository.findAllWithDetails()
                : getBuildingInvoices(buildingId);

        return invoices
                .stream()
                .map(invoice -> invoiceMapper.toResponse(invoice, findUtilityReadingForInvoice(invoice)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(Long id, Long buildingId) {
        Invoice invoice = findInvoice(id);
        validateInvoiceBelongsToBuilding(invoice, buildingId);
        return invoiceMapper.toResponse(invoice, findUtilityReadingForInvoice(invoice));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getResidentInvoices(Long residentHeadId) {
        RoomAssignment assignment = findResidentAssignment(residentHeadId);

        return invoiceRepository.findByRoomIdWithDetails(assignment.getRoom().getId())
                .stream()
                .map(invoice -> invoiceMapper.toResponse(invoice, findUtilityReadingForInvoice(invoice)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getResidentInvoice(Long residentHeadId, Long id) {
        RoomAssignment assignment = findResidentAssignment(residentHeadId);
        Invoice invoice = findInvoice(id);

        if (!invoice.getRoom().getId().equals(assignment.getRoom().getId())) {
            throw new ForbiddenException("Invoice does not belong to the current Head Resident room");
        }

        return invoiceMapper.toResponse(invoice, findUtilityReadingForInvoice(invoice));
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

    private void addUtilityItem(
            Invoice invoice,
            List<ServiceFee> activeFees,
            UtilityReading utilityReading,
            FeeType feeType
    ) {
        ServiceFee serviceFee = findRequiredFee(activeFees, feeType, CalculationType.BY_USAGE);
        BigDecimal usage = feeType == FeeType.ELECTRICITY
                ? utilityReading.getNewElectricity().subtract(utilityReading.getOldElectricity())
                : utilityReading.getNewWater().subtract(utilityReading.getOldWater());

        addServiceFeeItem(
                invoice,
                serviceFee,
                usage,
                feeType == FeeType.ELECTRICITY ? "Electricity usage" : "Water usage"
        );
    }

    private void addFixedFeeItems(Invoice invoice, List<ServiceFee> activeFees) {
        activeFees.stream()
                .filter(fee -> fee.getCalculationType() == CalculationType.FIXED)
                .filter(fee -> fee.getFeeType() != FeeType.ROOM)
                .filter(fee -> fee.getFeeType() != FeeType.ELECTRICITY)
                .filter(fee -> fee.getFeeType() != FeeType.WATER)
                .filter(fee -> fee.getFeeType() != FeeType.PARKING)
                .forEach(fee -> addServiceFeeItem(invoice, fee, ONE, "Fixed service fee"));
    }

    private void addByPersonFeeItems(
            Invoice invoice,
            List<ServiceFee> activeFees,
            BigDecimal occupantQuantity
    ) {
        activeFees.stream()
                .filter(fee -> fee.getCalculationType() == CalculationType.BY_PERSON)
                .forEach(fee -> addServiceFeeItem(invoice, fee, occupantQuantity, "Head Resident plus approved room members"));
    }

    private void addParkingFeeItems(
            Invoice invoice,
            List<ServiceFee> activeFees,
            List<Vehicle> activeVehicles
    ) {
        activeFees.stream()
                .filter(fee -> fee.getFeeType() == FeeType.PARKING)
                .filter(fee -> fee.getCalculationType() == CalculationType.BY_QUANTITY)
                .forEach(fee -> {
                    long quantity = activeVehicles.stream()
                            .filter(vehicle -> fee.getVehicleType() == null
                                    || vehicle.getVehicleType() == fee.getVehicleType())
                            .count();

                    if (quantity > 0) {
                        addServiceFeeItem(invoice, fee, BigDecimal.valueOf(quantity), "Active vehicles");
                    }
                });
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

    private ServiceFee findRequiredFee(
            List<ServiceFee> activeFees,
            FeeType feeType,
            CalculationType calculationType
    ) {
        return activeFees.stream()
                .filter(fee -> fee.getFeeType() == feeType)
                .filter(fee -> fee.getCalculationType() == calculationType)
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "Active " + feeType.name().toLowerCase() + " fee is required for invoice generation"
                ));
    }

    private Invoice findInvoice(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }

    private List<Invoice> getBuildingInvoices(Long buildingId) {
        validateBuildingExists(buildingId);
        return invoiceRepository.findByBuildingIdWithDetails(buildingId);
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
        return utilityReadingRepository
                .findByRoomIdAndMonthWithDetails(invoice.getRoom().getId(), invoice.getMonth())
                .orElse(null);
    }

    private UtilityReading findUtilityReadingForGeneration(
            Room room,
            LocalDate month,
            boolean firstInvoiceForCurrentHead
    ) {
        return utilityReadingRepository
                .findByRoomIdAndMonthWithDetails(room.getId(), month)
                .orElseGet(() -> {
                    if (firstInvoiceForCurrentHead) {
                        return null;
                    }

                    throw new BadRequestException("Utility reading is required for this room and month");
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

    private LocalDate parseMonth(String month) {
        try {
            return YearMonth.parse(month.trim()).atDay(1);
        } catch (RuntimeException exception) {
            throw new BadRequestException("Invoice month must use YYYY-MM format");
        }
    }
}
