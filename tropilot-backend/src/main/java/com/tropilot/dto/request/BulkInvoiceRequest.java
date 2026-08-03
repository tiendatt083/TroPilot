package com.tropilot.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
/** Khoảng thời gian dùng để xem trước hoặc tạo hàng loạt hóa đơn trong một tòa nhà. */
public class BulkInvoiceRequest {

    @NotNull(message = "Invoice date is required")
    private LocalDate invoiceDate;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;
}
