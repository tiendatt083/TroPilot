package com.tropilot.mapper;

import com.tropilot.mapper.SepayPaymentMapper;

import com.tropilot.dto.response.InvoiceItemResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Feedback;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.InvoiceItem;
import com.tropilot.entity.Room;
import com.tropilot.entity.ServiceFee;
import com.tropilot.entity.SepayPayment;
import com.tropilot.entity.User;
import com.tropilot.entity.UtilityReading;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
public class InvoiceMapper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final SepayPaymentMapper sepayPaymentMapper;

    public InvoiceResponse toResponse(Invoice invoice, UtilityReading utilityReading) {
        return toResponse(invoice, utilityReading, null);
    }

    public InvoiceResponse toResponse(Invoice invoice, UtilityReading utilityReading, Feedback invoiceComplaint) {
        return toResponse(invoice, utilityReading, invoiceComplaint, null);
    }

    public InvoiceResponse toResponse(
            Invoice invoice,
            UtilityReading utilityReading,
            Feedback invoiceComplaint,
            SepayPayment sepayPayment
    ) {
        Room room = invoice.getRoom();
        Building building = room.getBuilding();
        User residentHead = invoice.getResidentHead();
        User createdBy = invoice.getCreatedBy();

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .invoiceDate(resolveInvoiceDate(invoice))
                .month(invoice.getMonth().format(MONTH_FORMATTER))
                .utilityMonth(utilityReading == null ? null : utilityReading.getMonth().format(MONTH_FORMATTER))
                .totalAmount(invoice.getTotalAmount())
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .hasInvoiceComplaint(invoiceComplaint != null)
                .invoiceComplaintStatus(invoiceComplaint == null ? null : invoiceComplaint.getStatus().name())
                .sepayPayment(sepayPaymentMapper.toResponse(sepayPayment))
                .createdById(createdBy.getId())
                .createdByName(createdBy.getFullName())
                .createdByRole(createdBy.getRole().name())
                .electricityImageUrl(utilityReading == null ? null : utilityReading.getElectricityImageUrl())
                .waterImageUrl(utilityReading == null ? null : utilityReading.getWaterImageUrl())
                .items(toItemResponses(invoice.getItems()))
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }

    private LocalDate resolveInvoiceDate(Invoice invoice) {
        if (invoice.getInvoiceDate() != null) {
            return invoice.getInvoiceDate();
        }

        return invoice.getCreatedAt() == null ? invoice.getMonth() : invoice.getCreatedAt().toLocalDate();
    }

    private List<InvoiceItemResponse> toItemResponses(List<InvoiceItem> items) {
        return items.stream()
                .sorted(Comparator.comparing(InvoiceItem::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toItemResponse)
                .toList();
    }

    private InvoiceItemResponse toItemResponse(InvoiceItem item) {
        ServiceFee serviceFee = item.getServiceFee();

        return InvoiceItemResponse.builder()
                .id(item.getId())
                .serviceFeeId(serviceFee == null ? null : serviceFee.getId())
                .itemName(item.getItemName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .amount(item.getAmount())
                .note(item.getNote())
                .build();
    }
}
