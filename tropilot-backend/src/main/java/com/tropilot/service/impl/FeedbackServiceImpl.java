package com.tropilot.service.impl;

import com.tropilot.dto.request.FeedbackCreateRequest;
import com.tropilot.dto.request.FeedbackReplyRequest;
import com.tropilot.dto.request.FeedbackStatusUpdateRequest;
import com.tropilot.dto.request.InvoiceComplaintRequest;
import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.entity.Feedback;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.FeedbackStatus;
import com.tropilot.enums.FeedbackType;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.FeedbackRepository;
import com.tropilot.repository.InvoiceRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final FeedbackMapper feedbackMapper;

    @Override
    @Transactional
    public FeedbackResponse createResidentFeedback(Long residentHeadId, FeedbackCreateRequest request) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        FeedbackType type = parseFeedbackType(request.getType());

        if (type == FeedbackType.INVOICE_COMPLAINT) {
            throw new BadRequestException("Invoice complaints must be submitted from invoice details");
        }

        Feedback feedback = Feedback.builder()
                .residentHead(assignment.getResidentHead())
                .room(assignment.getRoom())
                .type(type)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .status(FeedbackStatus.PENDING)
                .build();

        return feedbackMapper.toResponse(feedbackRepository.save(feedback));
    }

    @Override
    @Transactional
    public FeedbackResponse createInvoiceComplaint(
            Long residentHeadId,
            Long invoiceId,
            InvoiceComplaintRequest request
    ) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        if (!invoice.getRoom().getId().equals(assignment.getRoom().getId())) {
            throw new ForbiddenException("Invoice does not belong to the current Head Resident room");
        }

        Feedback feedback = Feedback.builder()
                .residentHead(assignment.getResidentHead())
                .room(assignment.getRoom())
                .invoice(invoice)
                .type(FeedbackType.INVOICE_COMPLAINT)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .status(FeedbackStatus.PENDING)
                .build();

        return feedbackMapper.toResponse(feedbackRepository.save(feedback));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedbacks() {
        return feedbackRepository.findAllWithDetails()
                .stream()
                .map(feedbackMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackResponse> getInvoiceComplaints() {
        return feedbackRepository.findByTypeWithDetails(FeedbackType.INVOICE_COMPLAINT)
                .stream()
                .map(feedbackMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public FeedbackResponse replyFeedback(Long id, Long repliedById, FeedbackReplyRequest request) {
        Feedback feedback = findFeedback(id);
        User repliedBy = findUser(repliedById);

        feedback.setReply(request.getReply().trim());
        feedback.setRepliedBy(repliedBy);

        return feedbackMapper.toResponse(feedbackRepository.save(feedback));
    }

    @Override
    @Transactional
    public FeedbackResponse updateFeedbackStatus(Long id, FeedbackStatusUpdateRequest request) {
        Feedback feedback = findFeedback(id);
        feedback.setStatus(parseFeedbackStatus(request.getStatus()));

        return feedbackMapper.toResponse(feedbackRepository.save(feedback));
    }

    private RoomAssignment findActiveAssignment(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Head Resident must have an active room"));
    }

    private Feedback findFeedback(Long id) {
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private FeedbackType parseFeedbackType(String type) {
        try {
            return FeedbackType.valueOf(type.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Feedback type is invalid");
        }
    }

    private FeedbackStatus parseFeedbackStatus(String status) {
        try {
            return FeedbackStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Feedback status is invalid");
        }
    }
}
