package com.tropilot.mapper;

import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Receipt;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
/**
 * Chuyển biên lai đã lập thành dữ liệu trả về cho API.
 * Mapper cung cấp cả mã biên lai, số tiền và ngữ cảnh hóa đơn/phòng/cư dân liên quan.
 */
public class ReceiptMapper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    /**
     * Tạo ReceiptResponse và định dạng tháng của hóa đơn theo yyyy-MM để client dễ hiển thị.
     */
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
