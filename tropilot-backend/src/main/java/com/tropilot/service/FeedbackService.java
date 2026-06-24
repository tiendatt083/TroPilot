package com.tropilot.service;

import com.tropilot.dto.request.FeedbackCreateRequest;
import com.tropilot.dto.request.FeedbackReplyRequest;
import com.tropilot.dto.request.FeedbackStatusUpdateRequest;
import com.tropilot.dto.request.InvoiceComplaintRequest;
import com.tropilot.dto.response.FeedbackResponse;

import java.util.List;

public interface FeedbackService {

    FeedbackResponse createResidentFeedback(Long residentHeadId, FeedbackCreateRequest request);

    FeedbackResponse createInvoiceComplaint(Long residentHeadId, Long invoiceId, InvoiceComplaintRequest request);

    List<FeedbackResponse> getResidentFeedbacks(Long residentHeadId);

    List<FeedbackResponse> getFeedbacks(Long buildingId);

    List<FeedbackResponse> getInvoiceComplaints(Long buildingId);

    FeedbackResponse replyFeedback(Long id, Long repliedById, FeedbackReplyRequest request, Long buildingId);

    FeedbackResponse updateFeedbackStatus(Long id, FeedbackStatusUpdateRequest request, Long buildingId);
}
