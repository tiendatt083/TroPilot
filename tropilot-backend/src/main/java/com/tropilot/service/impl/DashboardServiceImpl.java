package com.tropilot.service.impl;

import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
import com.tropilot.dto.response.RoomHeadResponse;
import com.tropilot.dto.response.StaffDashboardResponse;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.UtilityReading;
import com.tropilot.enums.ExpenseStatus;
import com.tropilot.enums.FeedbackStatus;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.MaintenanceStatus;
import com.tropilot.enums.PaymentStatus;
import com.tropilot.enums.ReceiptStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.ExpenseRepository;
import com.tropilot.repository.FeedbackRepository;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.MaintenanceRequestRepository;
import com.tropilot.repository.PaymentRepository;
import com.tropilot.repository.ReceiptRepository;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.TaskRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.repository.UtilityReadingRepository;
import com.tropilot.repository.VehicleRepository;
import com.tropilot.service.DashboardService;
import com.tropilot.service.HeadResidentAssignmentService;
import com.tropilot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final int CONTRACT_EXPIRING_DAYS = 30;
    private static final int RECENT_MAINTENANCE_LIMIT = 5;

    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final VehicleRepository vehicleRepository;
    private final RentalContractRepository rentalContractRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final ExpenseRepository expenseRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final TaskRepository taskRepository;
    private final FeedbackRepository feedbackRepository;
    private final PaymentRepository paymentRepository;
    private final UtilityReadingRepository utilityReadingRepository;
    private final HeadResidentAssignmentService headResidentAssignmentService;
    private final NotificationService notificationService;
    private final RentalContractMapper rentalContractMapper;
    private final InvoiceMapper invoiceMapper;
    private final VehicleMapper vehicleMapper;
    private final MaintenanceRequestMapper maintenanceRequestMapper;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard() {
        LocalDate today = LocalDate.now();
        long activeAssignedHeads = roomAssignmentRepository.countByStatus(RoomAssignmentStatus.ACTIVE);
        long approvedMembers = roomMemberRepository.countByStatus(RoomMemberStatus.APPROVED);
        BigDecimal totalIncome = nonNull(receiptRepository.sumAmountByStatus(ReceiptStatus.VALID));
        BigDecimal totalExpense = nonNull(expenseRepository.sumAmountByStatus(ExpenseStatus.VALID));

        return AdminDashboardResponse.builder()
                .totalBuildings(buildingRepository.count())
                .totalRooms(roomRepository.count())
                .emptyRooms(roomRepository.countByStatus(RoomStatus.EMPTY))
                .occupiedRooms(roomRepository.countByStatus(RoomStatus.OCCUPIED))
                .maintenanceRooms(roomRepository.countByStatus(RoomStatus.MAINTENANCE))
                .totalHeadResidents(userRepository.countByRole(UserRole.RESIDENT_HEAD))
                .totalApprovedRoomMembers(approvedMembers)
                .totalOccupants(activeAssignedHeads + approvedMembers)
                .totalActiveVehicles(vehicleRepository.countByStatus(VehicleStatus.ACTIVE))
                .expiringContracts(rentalContractRepository.countByRentalStatusAndEndDateBetween(
                        RentalStatus.ACTIVE,
                        today,
                        today.plusDays(CONTRACT_EXPIRING_DAYS)
                ))
                .unpaidInvoices(invoiceRepository.countByStatus(InvoiceStatus.UNPAID))
                .overdueInvoices(invoiceRepository.countByDueDateBeforeAndStatusNot(today, InvoiceStatus.PAID))
                .totalIncome(totalIncome)
                .unpaidAmount(nonNull(invoiceRepository.sumUnpaidAmount(InvoiceStatus.PAID)))
                .totalExpense(totalExpense)
                .remainingCash(totalIncome.subtract(totalExpense))
                .pendingMaintenanceRequests(maintenanceRequestRepository.countByStatus(MaintenanceStatus.PENDING))
                .inProgressTasks(taskRepository.countByStatus(TaskStatus.IN_PROGRESS))
                .unresolvedFeedbacks(feedbackRepository.countByStatusIn(List.of(
                        FeedbackStatus.PENDING,
                        FeedbackStatus.IN_PROGRESS
                )))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StaffDashboardResponse getStaffDashboard(Long staffId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate currentMonth = YearMonth.now().atDay(1);
        List<TaskStatus> activeTaskStatuses = List.of(
                TaskStatus.NEW,
                TaskStatus.IN_PROGRESS,
                TaskStatus.OVERDUE
        );

        return StaffDashboardResponse.builder()
                .assignedTasks(taskRepository.countByAssignedTo_IdAndStatusIn(staffId, activeTaskStatuses))
                .overdueTasks(taskRepository.countByAssignedTo_IdAndDeadlineBeforeAndStatusIn(
                        staffId,
                        now,
                        activeTaskStatuses
                ))
                .roomsNeedingUtilityReading(roomRepository.countByStatusWithoutUtilityReadingForMonth(
                        RoomStatus.OCCUPIED,
                        currentMonth
                ))
                .pendingPaymentConfirmations(paymentRepository.countByStatus(PaymentStatus.PENDING))
                .activeMaintenanceRequests(maintenanceRequestRepository.countByAssignedTo_IdAndStatusIn(
                        staffId,
                        List.of(MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS)
                ))
                .createdExpenses(expenseRepository.countByCreatedBy_Id(staffId))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ResidentDashboardResponse getResidentDashboard(Long residentHeadId) {
        RoomHeadResponse currentRoom = headResidentAssignmentService.getResidentAssignedRoom(residentHeadId);

        if (!currentRoom.isAssigned()) {
            return ResidentDashboardResponse.builder()
                    .currentRoom(currentRoom)
                    .approvedMemberCount(0)
                    .activeVehicles(List.of())
                    .unreadNotifications(countUnreadResidentNotifications(residentHeadId))
                    .recentMaintenanceRequests(List.of())
                    .build();
        }

        Long roomId = currentRoom.getRoomId();
        RentalContractResponse currentContract = rentalContractRepository
                .findFirstByResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(residentHeadId, RentalStatus.ACTIVE)
                .map(rentalContractMapper::toResponse)
                .orElse(null);
        InvoiceResponse latestInvoice = findLatestInvoice(roomId);
        List<VehicleResponse> activeVehicles = vehicleRepository
                .findByRoomIdAndStatusWithDetails(roomId, VehicleStatus.ACTIVE)
                .stream()
                .map(vehicleMapper::toResponse)
                .toList();
        List<MaintenanceRequestResponse> recentMaintenanceRequests = maintenanceRequestRepository
                .findByRoomIdAndResidentHeadIdWithDetails(roomId, residentHeadId)
                .stream()
                .limit(RECENT_MAINTENANCE_LIMIT)
                .map(maintenanceRequestMapper::toResponse)
                .toList();

        return ResidentDashboardResponse.builder()
                .currentRoom(currentRoom)
                .approvedMemberCount(roomMemberRepository.countByRoom_IdAndStatus(roomId, RoomMemberStatus.APPROVED))
                .currentContract(currentContract)
                .latestInvoice(latestInvoice)
                .paymentDueDate(latestInvoice == null ? null : latestInvoice.getDueDate())
                .activeVehicles(activeVehicles)
                .unreadNotifications(countUnreadResidentNotifications(residentHeadId))
                .recentMaintenanceRequests(recentMaintenanceRequests)
                .build();
    }

    private InvoiceResponse findLatestInvoice(Long roomId) {
        return invoiceRepository.findFirstByRoom_IdOrderByMonthDescCreatedAtDesc(roomId)
                .map(this::toInvoiceResponse)
                .orElse(null);
    }

    private InvoiceResponse toInvoiceResponse(Invoice invoice) {
        UtilityReading reading = utilityReadingRepository
                .findByRoomIdAndMonthWithDetails(invoice.getRoom().getId(), invoice.getMonth())
                .orElse(null);

        return invoiceMapper.toResponse(invoice, reading);
    }

    private long countUnreadResidentNotifications(Long residentHeadId) {
        return notificationService.getResidentNotifications(residentHeadId)
                .stream()
                .filter(notification -> !notification.isRead())
                .count();
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
