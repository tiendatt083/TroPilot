package com.tropilot.service.impl;

import com.tropilot.dto.response.CashFlowResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.dto.response.RoomResponse;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.dto.response.VehicleResponse;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class ChatContextRecordMapper {

    private ChatContextRecordMapper() {
    }

    static Map<String, Object> room(RoomResponse room, List<String> reasons) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("roomCode", room.getRoomCode());
        data.put("roomName", room.getRoomName());
        data.put("buildingCode", room.getBuildingCode());
        data.put("buildingName", room.getBuildingName());
        data.put("status", room.getStatus());
        data.put("reasons", reasons);
        return data;
    }

    static Map<String, Object> invoice(InvoiceResponse invoice) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", invoice.getBuildingCode());
        data.put("roomCode", invoice.getRoomCode());
        data.put("residentHeadName", invoice.getResidentHeadName());
        data.put("invoiceDate", invoice.getInvoiceDate());
        data.put("month", invoice.getMonth());
        data.put("utilityMonth", invoice.getUtilityMonth());
        data.put("dueDate", invoice.getDueDate());
        data.put("totalAmount", invoice.getTotalAmount());
        data.put("status", invoice.getStatus());
        data.put("hasInvoiceComplaint", invoice.isHasInvoiceComplaint());
        data.put("invoiceComplaintStatus", invoice.getInvoiceComplaintStatus());
        if (invoice.getSepayPayment() != null) {
            data.put("sepayPaymentStatus", invoice.getSepayPayment().getStatus());
            data.put("paidAmount", invoice.getSepayPayment().getPaidAmount());
            data.put("paidAt", invoice.getSepayPayment().getPaidAt());
        }
        return data;
    }

    static Map<String, Object> contract(RentalContractResponse contract) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", contract.getBuildingCode());
        data.put("roomCode", contract.getRoomCode());
        data.put("residentHeadName", contract.getResidentHeadName());
        data.put("startDate", contract.getStartDate());
        data.put("endDate", contract.getEndDate());
        data.put("remainingDays", remainingDays(contract.getEndDate()));
        data.put("contractStatus", contract.getContractStatus());
        data.put("rentalStatus", contract.getRentalStatus());
        return data;
    }

    static Map<String, Object> maintenance(MaintenanceRequestResponse request) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", request.getBuildingCode());
        data.put("roomCode", request.getRoomCode());
        data.put("equipmentCode", request.getEquipmentCode());
        data.put("equipmentName", request.getEquipmentName());
        data.put("title", request.getTitle());
        data.put("status", request.getStatus());
        data.put("assignedToName", request.getAssignedToName());
        data.put("createdAt", request.getCreatedAt());
        data.put("updatedAt", request.getUpdatedAt());
        return data;
    }

    static Map<String, Object> task(TaskResponse task) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", task.getBuildingCode());
        data.put("roomCode", task.getRoomCode());
        data.put("title", task.getTitle());
        data.put("taskType", task.getTaskType());
        data.put("deadline", task.getDeadline());
        data.put("priority", task.getPriority());
        data.put("status", task.getStatus());
        data.put("assignedToName", task.getAssignedToName());
        return data;
    }

    static Map<String, Object> payment(PaymentResponse payment) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", payment.getBuildingCode());
        data.put("roomCode", payment.getRoomCode());
        data.put("residentHeadName", payment.getResidentHeadName());
        data.put("invoiceMonth", payment.getInvoiceMonth());
        data.put("invoiceTotalAmount", payment.getInvoiceTotalAmount());
        data.put("invoiceStatus", payment.getInvoiceStatus());
        data.put("paymentStatus", payment.getStatus());
        data.put("uploadedAt", payment.getUploadedAt());
        return data;
    }

    static Map<String, Object> member(RoomMemberResponse member) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("fullName", member.getFullName());
        data.put("relationship", member.getRelationship());
        data.put("moveInDate", member.getMoveInDate());
        data.put("status", member.getStatus());
        return data;
    }

    static Map<String, Object> vehicle(VehicleResponse vehicle) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("ownerName", vehicle.getOwnerName());
        data.put("ownerType", vehicle.getOwnerType());
        data.put("vehicleType", vehicle.getVehicleType());
        data.put("licensePlate", vehicle.getLicensePlate());
        data.put("status", vehicle.getStatus());
        data.put("billable", vehicle.isBillable());
        return data;
    }

    static Map<String, Object> notification(NotificationResponse notification) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("title", notification.getTitle());
        data.put("content", notification.getContent());
        data.put("createdAt", notification.getCreatedAt());
        data.put("read", notification.isRead());
        return data;
    }

    static Map<String, Object> cashFlow(CashFlowResponse cashFlow) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("month", cashFlow.getMonth());
        data.put("totalIncome", cashFlow.getTotalIncome());
        data.put("totalExpense", cashFlow.getTotalExpense());
        data.put("remainingCash", cashFlow.getRemainingCash());
        data.put("unpaidAmount", cashFlow.getUnpaidAmount());
        return data;
    }

    private static Long remainingDays(LocalDate endDate) {
        return endDate == null ? null : ChronoUnit.DAYS.between(LocalDate.now(), endDate);
    }
}
