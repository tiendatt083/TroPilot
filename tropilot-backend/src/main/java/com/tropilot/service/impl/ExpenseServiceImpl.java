package com.tropilot.service.impl;

import com.tropilot.dto.request.ExpenseRequest;
import com.tropilot.dto.response.ExpenseResponse;
import com.tropilot.entity.Expense;
import com.tropilot.entity.MaintenanceRequest;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import com.tropilot.enums.ExpenseStatus;
import com.tropilot.enums.ExpenseType;
import com.tropilot.enums.UserRole;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.ExpenseRepository;
import com.tropilot.repository.MaintenanceRequestRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private static final DateTimeFormatter EXPENSE_CODE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final ExpenseRepository expenseRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final ExpenseProofStorageService expenseProofStorageService;
    private final ExpenseMapper expenseMapper;

    @Override
    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request, Long createdById) {
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
                .status(ExpenseStatus.VALID)
                .build();

        return expenseMapper.toResponse(expenseRepository.save(expense));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses() {
        return expenseRepository.findAllWithDetails()
                .stream()
                .map(expenseMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ExpenseResponse cancelExpense(Long id) {
        Expense expense = findExpense(id);

        if (expense.getStatus() == ExpenseStatus.CANCELLED) {
            throw new BadRequestException("Expense is already cancelled");
        }

        expense.setStatus(ExpenseStatus.CANCELLED);
        return expenseMapper.toResponse(expenseRepository.save(expense));
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

        if (room != null && !maintenanceRequest.getRoom().getId().equals(room.getId())) {
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
