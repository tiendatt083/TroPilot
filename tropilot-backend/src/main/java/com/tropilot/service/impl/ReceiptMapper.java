package com.tropilot.service.impl;

import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Receipt;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class ReceiptMapper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public ReceiptResponse toResponse(Receipt receipt) {
        Invoice invoice = receipt.getInvoice();
        Room room = receipt.getRoom();
        Building building = room.getBuilding();
        User residentHead = receipt.getResidentHead();
        User createdBy = receipt.getCreatedBy();

        return ReceiptResponse.builder()
                .id(receipt.getId())
                .receiptCode(receipt.getReceiptCode())
                .invoiceId(invoice.getId())
                .invoiceMonth(invoice.getMonth().format(MONTH_FORMATTER))
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .amount(receipt.getAmount())
                .content(receipt.getContent())
                .createdById(createdBy.getId())
                .createdByName(createdBy.getFullName())
                .createdByRole(createdBy.getRole().name())
                .createdAt(receipt.getCreatedAt())
                .status(receipt.getStatus())
                .build();
    }
}
