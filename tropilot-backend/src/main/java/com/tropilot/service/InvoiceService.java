package com.tropilot.service;

import com.tropilot.dto.request.InvoiceGenerateRequest;
import com.tropilot.dto.response.InvoiceResponse;

import java.util.List;

public interface InvoiceService {

    InvoiceResponse generateInvoice(InvoiceGenerateRequest request, Long createdById);

    List<InvoiceResponse> getInvoices();

    InvoiceResponse getInvoice(Long id);

    List<InvoiceResponse> getResidentInvoices(Long residentHeadId);

    InvoiceResponse getResidentInvoice(Long residentHeadId, Long id);
}
