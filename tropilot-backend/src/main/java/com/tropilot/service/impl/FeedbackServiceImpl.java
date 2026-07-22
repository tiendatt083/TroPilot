package com.tropilot.service.impl;

import com.tropilot.mapper.FeedbackMapper;
import com.tropilot.dto.request.FeedbackCreateRequest;
import com.tropilot.dto.request.FeedbackReplyRequest;
import com.tropilot.dto.request.FeedbackStatusUpdateRequest;
import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.entity.Feedback;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.FeedbackStatus;
import com.tropilot.enums.FeedbackType;
import com.tropilot.enums.NotificationEventType;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.FeedbackRepository;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.FeedbackService;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final BuildingRepository buildingRepository;
    private final UserRepository userRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final FeedbackMapper feedbackMapper;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public FeedbackResponse createResidentFeedback(Long residentHeadId, FeedbackCreateRequest request) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        FeedbackType type = parseFeedbackType(request.getType());

        Feedback feedback = Feedback.builder()
                .residentHead(assignment.getResidentHead())
                .room(assignment.getRoom())
                .type(type)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .status(FeedbackStatus.PENDING)
                .build();

        Feedback savedFeedback = feedbackRepository.save(feedback);
        activityLogService.record(
                assignment.getResidentHead(),
                "FEEDBACK_CREATED",
                "Created feedback " + savedFeedback.getTitle()
                        + " for room " + assignment.getRoom().getRoomCode()
        );
        notifyAdminsAboutNewFeedback(savedFeedback);

        return feedbackMapper.toResponse(savedFeedback);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackResponse> getResidentFeedbacks(Long residentHeadId) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);

        return feedbackRepository
                .findByResidentHeadIdAndRoomIdWithDetails(residentHeadId, assignment.getRoom().getId())
                .stream()
                .map(feedbackMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedbacks(Long buildingId) {
        List<Feedback> feedbacks = buildingId == null
                ? feedbackRepository.findAllWithDetails()
                : getBuildingFeedbacks(buildingId);

        return feedbacks
                .stream()
                .map(feedbackMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public FeedbackResponse replyFeedback(
            Long id,
            Long repliedById,
            FeedbackReplyRequest request,
            Long buildingId
    ) {
        Feedback feedback = findFeedback(id);
        User repliedBy = findUser(repliedById);
        validateFeedbackBelongsToBuilding(feedback, buildingId);

        feedback.setReply(request.getReply().trim());
        feedback.setRepliedBy(repliedBy);

        Feedback savedFeedback = feedbackRepository.save(feedback);
        activityLogService.record(
                repliedBy,
                "FEEDBACK_REPLIED",
                "Replied to feedback " + savedFeedback.getTitle()
        );
        notifyResidentAboutFeedbackUpdate(
                repliedBy,
                savedFeedback,
                "Phản hồi của bạn đã được trả lời",
                "Quản lý đã trả lời phản hồi \"" + savedFeedback.getTitle() + "\"."
        );

        return feedbackMapper.toResponse(savedFeedback);
    }

    @Override
    @Transactional
    public FeedbackResponse updateFeedbackStatus(
            Long id,
            Long updatedById,
            FeedbackStatusUpdateRequest request,
            Long buildingId
    ) {
        Feedback feedback = findFeedback(id);
        User updatedBy = findUser(updatedById);
        validateFeedbackBelongsToBuilding(feedback, buildingId);
        FeedbackStatus nextStatus = parseFeedbackStatus(request.getStatus());
        feedback.setStatus(nextStatus);

        Feedback savedFeedback = feedbackRepository.save(feedback);
        activityLogService.record(
                updatedBy,
                "FEEDBACK_STATUS_UPDATED",
                "Updated feedback " + savedFeedback.getTitle() + " to " + nextStatus.name()
        );
        notifyResidentAboutFeedbackUpdate(
                updatedBy,
                savedFeedback,
                "Trạng thái phản hồi đã thay đổi",
                "Phản hồi \"" + savedFeedback.getTitle() + "\" đã chuyển sang trạng thái " + nextStatus.name() + "."
        );

        return feedbackMapper.toResponse(savedFeedback);
    }

    private void notifyAdminsAboutNewFeedback(Feedback feedback) {
        String eventLabel = feedback.getType() == FeedbackType.INVOICE_COMPLAINT
                ? "khiếu nại hóa đơn"
                : "phản hồi";
        notificationService.notifyAdmins(
                feedback.getResidentHead(),
                NotificationEventType.FEEDBACK_CREATED,
                "Có " + eventLabel + " mới",
                feedback.getResidentHead().getFullName()
                        + " đã gửi " + eventLabel
                        + " từ phòng " + feedback.getRoom().getRoomCode()
                        + ": " + feedback.getTitle(),
                "/admin/buildings/" + feedback.getRoom().getBuilding().getId() + "/feedbacks",
                feedback.getRoom().getBuilding()
        );
    }

    private void notifyResidentAboutFeedbackUpdate(
            User actor,
            Feedback feedback,
            String title,
            String content
    ) {
        notificationService.notifyUser(
                actor,
                feedback.getResidentHead(),
                NotificationEventType.FEEDBACK_UPDATED,
                title,
                content,
                "/resident/feedbacks",
                feedback.getRoom().getBuilding()
        );
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

    private List<Feedback> getBuildingFeedbacks(Long buildingId) {
        validateBuildingExists(buildingId);
        return feedbackRepository.findByBuildingIdWithDetails(buildingId);
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validateFeedbackBelongsToBuilding(Feedback feedback, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(feedback.getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Feedback does not belong to the selected building");
        }
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
