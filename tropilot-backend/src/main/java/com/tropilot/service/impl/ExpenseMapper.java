package com.tropilot.service.impl;

import com.tropilot.dto.response.ExpenseResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Expense;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ExpenseMapper {

    public ExpenseResponse toResponse(Expense expense) {
        Room room = expense.getRoom();
        Building building = room == null ? null : room.getBuilding();
        User createdBy = expense.getCreatedBy();

        return ExpenseResponse.builder()
                .id(expense.getId())
                .expenseCode(expense.getExpenseCode())
                .roomId(room == null ? null : room.getId())
                .roomCode(room == null ? null : room.getRoomCode())
                .roomName(room == null ? null : room.getRoomName())
                .buildingId(building == null ? null : building.getId())
                .buildingCode(building == null ? null : building.getBuildingCode())
                .buildingName(building == null ? null : building.getName())
                .taskId(expense.getTaskId())
                .maintenanceRequestId(expense.getMaintenanceRequestId())
                .amount(expense.getAmount())
                .content(expense.getContent())
                .expenseType(expense.getExpenseType())
                .proofImageUrl(expense.getProofImageUrl())
                .createdById(createdBy.getId())
                .createdByName(createdBy.getFullName())
                .createdByRole(createdBy.getRole().name())
                .createdAt(expense.getCreatedAt())
                .status(expense.getStatus())
                .build();
    }
}
