package com.tropilot.service;

import com.tropilot.dto.request.InvoicePreviewRequest;
import com.tropilot.dto.request.BulkInvoiceRequest;
import com.tropilot.dto.response.BulkInvoicePreviewResponse;
import com.tropilot.dto.response.InvoicePreviewResponse;
import com.tropilot.dto.response.InvoiceResponse;

import java.util.List;

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
}
