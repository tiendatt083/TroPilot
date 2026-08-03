package com.tropilot.mapper;

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
/**
 * Chuyển hóa đơn và các dữ liệu liên quan thành InvoiceResponse.
 * Mapper tổng hợp phòng, cư dân, chỉ số điện nước, các dòng phí, khiếu nại và trạng thái thanh toán SePay.
 */
public class InvoiceMapper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final SepayPaymentMapper sepayPaymentMapper;

    /**
     * Chuyển hóa đơn khi chỉ có dữ liệu chỉ số điện nước; các thông tin tùy chọn khác được để trống.
     */
    public InvoiceResponse toResponse(Invoice invoice, UtilityReading utilityReading) {
        return toResponse(invoice, utilityReading, null);
    }

    /**
     * Chuyển hóa đơn và kèm phản hồi khiếu nại hóa đơn, nếu hóa đơn đang có khiếu nại.
     */
    public InvoiceResponse toResponse(Invoice invoice, UtilityReading utilityReading, Feedback invoiceComplaint) {
        return toResponse(invoice, utilityReading, invoiceComplaint, null);
    }

    /**
     * Tạo dữ liệu hóa đơn đầy đủ cho API từ hóa đơn và các đối tượng liên quan đã được service chuẩn bị.
     */
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

    /**
     * Lấy ngày lập hóa đơn: ưu tiên ngày được lưu riêng; nếu chưa có thì dùng ngày tạo,
     * cuối cùng mới dùng tháng hóa đơn làm giá trị dự phòng.
     */
    private LocalDate resolveInvoiceDate(Invoice invoice) {
        if (invoice.getInvoiceDate() != null) {
            return invoice.getInvoiceDate();
        }

        return invoice.getCreatedAt() == null ? invoice.getMonth() : invoice.getCreatedAt().toLocalDate();
    }

    /** Chuyển và sắp xếp các dòng phí theo id để thứ tự trả về luôn ổn định. */
    private List<InvoiceItemResponse> toItemResponses(List<InvoiceItem> items) {
        return items.stream()
                .sorted(Comparator.comparing(InvoiceItem::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toItemResponse)
                .toList();
    }

    /** Chuyển một dòng phí trên hóa đơn sang dữ liệu dùng để hiển thị. */
    private InvoiceItemResponse toItemResponse(InvoiceItem item) {
        ServiceFee serviceFee = item.getServiceFee();

        return InvoiceItemResponse.builder()
                .id(item.getId())
                .serviceFeeId(serviceFee == null ? null : serviceFee.getId())
                .itemName(item.getItemName())
                .calculationType(serviceFee == null ? null : serviceFee.getCalculationType().name())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .amount(item.getAmount())
                .note(item.getNote())
                .build();
    }
}
