package com.tropilot.service;

import com.tropilot.dto.request.PaymentUploadRequest;
import com.tropilot.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {

    PaymentResponse uploadPaymentProof(Long residentHeadId, PaymentUploadRequest request);

    List<PaymentResponse> getPendingPayments(Long buildingId);
}
