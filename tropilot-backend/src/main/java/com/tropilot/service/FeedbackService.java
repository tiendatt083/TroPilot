package com.tropilot.service;

import com.tropilot.dto.request.FeedbackCreateRequest;
import com.tropilot.dto.request.FeedbackReplyRequest;
import com.tropilot.dto.request.FeedbackStatusUpdateRequest;
import com.tropilot.dto.response.FeedbackResponse;

import java.util.List;

/** Hợp đồng tiếp nhận, xem và phản hồi góp ý hoặc khiếu nại của cư dân. */
public interface FeedbackService {

    FeedbackResponse createResidentFeedback(Long residentHeadId, FeedbackCreateRequest request);

    List<FeedbackResponse> getResidentFeedbacks(Long residentHeadId);

    List<FeedbackResponse> getFeedbacks(Long buildingId);

    FeedbackResponse replyFeedback(Long id, Long repliedById, FeedbackReplyRequest request, Long buildingId);

    FeedbackResponse updateFeedbackStatus(
            Long id,
            Long updatedById,
            FeedbackStatusUpdateRequest request,
            Long buildingId
    );
}
