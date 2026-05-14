package com.tropilot.service.impl;

import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Payment;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class PaymentMapper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public PaymentResponse toResponse(Payment payment) {
        Invoice invoice = payment.getInvoice();
        Room room = invoice.getRoom();
        Building building = room.getBuilding();
        User residentHead = payment.getResidentHead();
        User confirmedBy = payment.getConfirmedBy();

        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(invoice.getId())
                .invoiceMonth(invoice.getMonth().format(MONTH_FORMATTER))
                .invoiceTotalAmount(invoice.getTotalAmount())
                .invoiceStatus(invoice.getStatus())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .proofImageUrl(payment.getProofImageUrl())
                .status(payment.getStatus())
                .uploadedAt(payment.getUploadedAt())
                .confirmedById(confirmedBy == null ? null : confirmedBy.getId())
                .confirmedByName(confirmedBy == null ? null : confirmedBy.getFullName())
                .confirmedByRole(confirmedBy == null ? null : confirmedBy.getRole().name())
                .confirmedAt(payment.getConfirmedAt())
                .note(payment.getNote())
                .build();
    }
}
