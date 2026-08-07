package com.tropilot.service;

import com.tropilot.dto.request.InvoicePreviewRequest;
import com.tropilot.dto.request.BulkInvoiceRequest;
import com.tropilot.dto.response.BulkInvoicePreviewResponse;
import com.tropilot.dto.response.InvoicePreviewResponse;
import com.tropilot.dto.response.InvoiceResponse;

import java.util.List;
import java.time.LocalDate;
import java.util.Optional;

/** Hợp đồng xem trước, tạo, tra cứu và xóa hóa đơn theo tòa nhà hoặc chủ hộ. */
public interface InvoiceService {

    InvoicePreviewResponse previewBuildingInvoice(Long buildingId, InvoicePreviewRequest request);

    InvoiceResponse generateBuildingInvoice(Long buildingId, InvoicePreviewRequest request, Long createdById);

    BulkInvoicePreviewResponse previewBuildingInvoices(Long buildingId, BulkInvoiceRequest request);

    List<InvoiceResponse> generateBuildingInvoices(Long buildingId, BulkInvoiceRequest request, Long createdById);

    void deleteBuildingInvoice(Long buildingId, Long invoiceId, Long deletedById);

    List<InvoiceResponse> getBuildingInvoices(Long buildingId);

    InvoiceResponse getBuildingInvoice(Long buildingId, Long invoiceId);

    List<InvoiceResponse> getResidentInvoices(Long residentHeadId);

    InvoiceResponse getResidentInvoice(Long residentHeadId, Long id);

    /**
     * Tạo hóa đơn chốt chỉ gồm điện/nước của tháng trước cho chủ hộ vừa kết thúc thuê.
     * Không tạo bản ghi khi chưa có chỉ số hợp lệ hoặc đã có hóa đơn tính kỳ đó.
     */
    Optional<InvoiceResponse> createFinalUtilityInvoice(
            Long roomId,
            Long residentHeadId,
            LocalDate utilityMonth,
            Long createdById
    );
}
