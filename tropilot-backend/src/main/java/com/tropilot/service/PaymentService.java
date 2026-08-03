package com.tropilot.service;

import com.tropilot.dto.request.PaymentUploadRequest;
import com.tropilot.dto.response.PaymentResponse;

import java.util.List;

/** Hợp đồng cư dân nộp minh chứng thanh toán và quản lý xem các phiếu chờ duyệt. */
public interface PaymentService {

    PaymentResponse uploadPaymentProof(Long residentHeadId, PaymentUploadRequest request);

    List<PaymentResponse> getPendingPayments(Long buildingId);
}
