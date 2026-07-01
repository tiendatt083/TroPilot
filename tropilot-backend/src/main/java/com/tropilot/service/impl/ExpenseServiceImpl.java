package com.tropilot.service.impl;

import com.tropilot.storage.ExpenseProofStorageService;
import com.tropilot.mapper.ExpenseMapper;
import com.tropilot.dto.request.ExpenseCreateRequest;
import com.tropilot.dto.response.ExpenseResponse;
import com.tropilot.entity.Expense;
import com.tropilot.entity.MaintenanceRequest;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import com.tropilot.enums.ExpenseStatus;
import com.tropilot.enums.ExpenseType;
import com.tropilot.enums.NotificationEventType;
import com.tropilot.enums.UserRole;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.ExpenseRepository;
import com.tropilot.repository.MaintenanceRequestRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.ExpenseService;
import com.tropilot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private static final DateTimeFormatter EXPENSE_CODE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final ExpenseRepository expenseRepository;
    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final ExpenseProofStorageService expenseProofStorageService;
    private final ExpenseMapper expenseMapper;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ExpenseResponse createExpense(ExpenseCreateRequest request, Long createdById) {
        User createdBy = findUser(createdById);
        Room room = request.getRoomId() == null ? null : findRoom(request.getRoomId());
        MaintenanceRequest maintenanceRequest = resolveMaintenanceRequest(request.getMaintenanceRequestId(), createdBy, room);

        if (maintenanceRequest != null && room == null) {
            room = maintenanceRequest.getRoom();
        }

        ExpenseType expenseType = parseExpenseType(request.getExpenseType());
        String proofImageUrl = expenseProofStorageService.store(request.getProofImage());

        Expense expense = Expense.builder()
                .expenseCode(generateExpenseCode())
                .room(room)
                .taskId(request.getTaskId())
                .maintenanceRequestId(request.getMaintenanceRequestId())
                .amount(request.getAmount())
                .content(request.getContent().trim())
                .expenseType(expenseType)
                .proofImageUrl(proofImageUrl)
                .createdBy(createdBy)
                .status(createdBy.getRole() == UserRole.STAFF ? ExpenseStatus.PENDING : ExpenseStatus.VALID)
                .build();

        Expense savedExpense = expenseRepository.save(expense);
        activityLogService.record(
                createdBy,
                "EXPENSE_CREATED",
                "Created expense " + savedExpense.getExpenseCode()
        );
        if (createdBy.getRole() == UserRole.STAFF) {
            notificationService.notifyAdmins(
                    createdBy,
                    NotificationEventType.EXPENSE_REQUESTED,
                    "Nhân viên gửi yêu cầu chi phí",
                    createdBy.getFullName()
                            + " đã gửi chi phí " + savedExpense.getExpenseCode()
                            + " với số tiền " + savedExpense.getAmount() + ".",
                    adminExpensePath(savedExpense),
                    savedExpense.getRoom() == null ? null : savedExpense.getRoom().getBuilding()
            );
        }

        return expenseMapper.toResponse(savedExpense);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses(Long buildingId) {
        List<Expense> expenses = buildingId == null
                ? expenseRepository.findAllWithDetails()
                : getBuildingExpenses(buildingId);

        return expenses
                .stream()
                .map(expenseMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ExpenseResponse approveExpense(Long id, Long approvedById, Long buildingId) {
        Expense expense = findExpense(id);
        User approvedBy = findUser(approvedById);
        validateExpenseBelongsToBuilding(expense, buildingId);

        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new BadRequestException("Only pending expenses can be approved");
        }

        expense.setStatus(ExpenseStatus.VALID);
        Expense savedExpense = expenseRepository.save(expense);
        activityLogService.record(
                approvedBy,
                "EXPENSE_APPROVED",
                "Approved expense " + savedExpense.getExpenseCode()
        );
        notifyExpenseCreator(
                approvedBy,
                savedExpense,
                NotificationEventType.EXPENSE_APPROVED,
                "Yêu cầu chi phí đã được duyệt",
                "Chi phí " + savedExpense.getExpenseCode() + " đã được quản lý phê duyệt."
        );

        return expenseMapper.toResponse(savedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponse cancelExpense(Long id, Long cancelledById, Long buildingId) {
        Expense expense = findExpense(id);
        User cancelledBy = findUser(cancelledById);
        validateExpenseBelongsToBuilding(expense, buildingId);

        if (expense.getStatus() == ExpenseStatus.CANCELLED) {
            throw new BadRequestException("Expense is already cancelled");
        }

        expense.setStatus(ExpenseStatus.CANCELLED);
        Expense savedExpense = expenseRepository.save(expense);
        activityLogService.record(
                cancelledBy,
                "EXPENSE_CANCELLED",
                "Cancelled expense " + savedExpense.getExpenseCode()
        );
        notifyExpenseCreator(
                cancelledBy,
                savedExpense,
                NotificationEventType.EXPENSE_REJECTED,
                "Yêu cầu chi phí không được duyệt",
                "Chi phí " + savedExpense.getExpenseCode() + " đã bị từ chối hoặc hủy."
        );

        return expenseMapper.toResponse(savedExpense);
    }

    private void notifyExpenseCreator(
            User actor,
            Expense expense,
            NotificationEventType eventType,
            String title,
            String content
    ) {
        if (expense.getCreatedBy().getRole() != UserRole.STAFF) {
            return;
        }
        notificationService.notifyUser(
                actor,
                expense.getCreatedBy(),
                eventType,
                title,
                content,
                "/staff/expenses",
                expense.getRoom() == null ? null : expense.getRoom().getBuilding()
        );
    }

    private String adminExpensePath(Expense expense) {
        return expense.getRoom() == null
                ? "/admin/expenses"
                : "/admin/buildings/" + expense.getRoom().getBuilding().getId() + "/expenses";
    }

    private String generateExpenseCode() {
        return "EXP-" + LocalDateTime.now().format(EXPENSE_CODE_FORMATTER) + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private ExpenseType parseExpenseType(String expenseType) {
        try {
            return ExpenseType.valueOf(expenseType.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Expense type is invalid");
        }
    }

    private Expense findExpense(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
    }

    private List<Expense> getBuildingExpenses(Long buildingId) {
        validateBuildingExists(buildingId);
        return expenseRepository.findByBuildingIdWithDetails(buildingId);
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validateExpenseBelongsToBuilding(Expense expense, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (expense.getRoom() == null
                || !Objects.equals(expense.getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Expense does not belong to the selected building");
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

    private MaintenanceRequest resolveMaintenanceRequest(Long maintenanceRequestId, User createdBy, Room room) {
        if (maintenanceRequestId == null) {
            return null;
        }

        MaintenanceRequest maintenanceRequest = maintenanceRequestRepository.findById(maintenanceRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found"));

        if (room != null
                && (maintenanceRequest.getRoom() == null
                || !maintenanceRequest.getRoom().getId().equals(room.getId()))) {
            throw new BadRequestException("Expense room must match the linked maintenance request room");
        }

        if (createdBy.getRole() == UserRole.STAFF) {
            User assignedTo = maintenanceRequest.getAssignedTo();

            if (assignedTo == null || !assignedTo.getId().equals(createdBy.getId())) {
                throw new ForbiddenException("Staff can only create expenses for assigned maintenance requests");
            }
        }

        return maintenanceRequest;
    }
}
