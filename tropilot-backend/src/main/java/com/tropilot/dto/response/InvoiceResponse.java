package com.tropilot.dto.response;

import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.InvoiceType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
/** Hóa đơn đã tạo: phòng, kỳ tính, trạng thái, ảnh chỉ số, thanh toán SePay và các dòng phí. */
public class InvoiceResponse {

    private Long id;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private LocalDate invoiceDate;
    private String month;
    private String utilityMonth;
    private BigDecimal totalAmount;
    private LocalDate dueDate;
    private InvoiceStatus status;
    private InvoiceType invoiceType;
    private boolean hasInvoiceComplaint;
    private String invoiceComplaintStatus;
    private SepayPaymentResponse sepayPayment;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private String electricityImageUrl;
    private String waterImageUrl;
    private List<InvoiceItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
