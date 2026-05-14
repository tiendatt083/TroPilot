package com.tropilot.service;

import com.tropilot.dto.request.PaymentDecisionRequest;
import com.tropilot.dto.request.PaymentUploadRequest;
import com.tropilot.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {

    PaymentResponse uploadPaymentProof(Long residentHeadId, PaymentUploadRequest request);

    List<PaymentResponse> getResidentPayments(Long residentHeadId);

    List<PaymentResponse> getPendingPayments();

    PaymentResponse approvePayment(Long paymentId, Long confirmedById, PaymentDecisionRequest request);

    PaymentResponse rejectPayment(Long paymentId, Long confirmedById, PaymentDecisionRequest request);
}
