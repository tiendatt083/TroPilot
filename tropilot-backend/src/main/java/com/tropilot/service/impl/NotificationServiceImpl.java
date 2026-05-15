package com.tropilot.service.impl;

import com.tropilot.dto.request.NotificationCreateRequest;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.entity.Notification;
import com.tropilot.entity.NotificationRead;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.NotificationTargetType;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.NotificationReadRepository;
import com.tropilot.repository.NotificationRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationCreateRequest request, Long createdById) {
        User createdBy = findUser(createdById);
        NotificationTargetType targetType = parseTargetType(request.getTargetType());
        validateTarget(targetType, request.getTargetId());

        Notification notification = Notification.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .targetType(targetType)
                .targetId(resolveTargetId(targetType, request.getTargetId()))
                .createdBy(createdBy)
                .build();

        return notificationMapper.toResponse(notificationRepository.save(notification), null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getResidentNotifications(Long userId) {
        User user = findUser(userId);
        Long roomId = findActiveRoomId(user.getId());

        return getVisibleNotifications(
                user.getId(),
                roomId,
                List.of(NotificationTargetType.ALL, NotificationTargetType.ALL_RESIDENT_HEADS)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getStaffNotifications(Long userId) {
        User user = findUser(userId);

        return getVisibleNotifications(
                user.getId(),
                null,
                List.of(NotificationTargetType.ALL, NotificationTargetType.STAFF)
        );
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        User user = findUser(userId);
        Notification notification = findNotification(notificationId);

        if (!isVisibleToUser(notification, user)) {
            throw new ForbiddenException("Notification is not visible to the current user");
        }

        NotificationRead read = notificationReadRepository
                .findByNotification_IdAndUser_Id(notificationId, userId)
                .orElseGet(() -> notificationReadRepository.save(NotificationRead.builder()
                        .notification(notification)
                        .user(user)
                        .build()));

        return notificationMapper.toResponse(notification, read);
    }

    private List<NotificationResponse> getVisibleNotifications(
            Long userId,
            Long roomId,
            Collection<NotificationTargetType> globalTargets
    ) {
        List<Notification> notifications = notificationRepository.findVisibleNotifications(
                globalTargets,
                NotificationTargetType.ONE_USER,
                userId,
                NotificationTargetType.ONE_ROOM,
                roomId
        );

        List<Long> notificationIds = notifications.stream()
                .map(Notification::getId)
                .toList();

        if (notificationIds.isEmpty()) {
            return List.of();
        }

        Map<Long, NotificationRead> readsByNotificationId = notificationReadRepository
                .findByUser_IdAndNotification_IdIn(userId, notificationIds)
                .stream()
                .collect(Collectors.toMap(read -> read.getNotification().getId(), Function.identity()));

        return notifications.stream()
                .map(notification -> notificationMapper.toResponse(
                        notification,
                        readsByNotificationId.get(notification.getId())
                ))
                .toList();
    }

    private boolean isVisibleToUser(Notification notification, User user) {
        return switch (notification.getTargetType()) {
            case ALL -> true;
            case STAFF -> user.getRole().name().equals("STAFF");
            case ALL_RESIDENT_HEADS -> user.getRole().name().equals("RESIDENT_HEAD");
            case ONE_USER -> notification.getTargetId().equals(user.getId());
            case ONE_ROOM -> findActiveRoomId(user.getId()) != null
                    && notification.getTargetId().equals(findActiveRoomId(user.getId()));
        };
    }

    private void validateTarget(NotificationTargetType targetType, Long targetId) {
        switch (targetType) {
            case ALL, ALL_RESIDENT_HEADS, STAFF -> {
                if (targetId != null) {
                    throw new BadRequestException("Target ID must be empty for this notification target");
                }
            }
            case ONE_ROOM -> {
                if (targetId == null) {
                    throw new BadRequestException("Target room is required");
                }
                if (!roomRepository.existsById(targetId)) {
                    throw new ResourceNotFoundException("Room not found");
                }
            }
            case ONE_USER -> {
                if (targetId == null) {
                    throw new BadRequestException("Target user is required");
                }
                if (!userRepository.existsById(targetId)) {
                    throw new ResourceNotFoundException("User not found");
                }
            }
        }
    }

    private Long resolveTargetId(NotificationTargetType targetType, Long targetId) {
        return switch (targetType) {
            case ALL, ALL_RESIDENT_HEADS, STAFF -> null;
            case ONE_ROOM, ONE_USER -> targetId;
        };
    }

    private Long findActiveRoomId(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .map(RoomAssignment::getRoom)
                .map(room -> room.getId())
                .orElse(null);
    }

    private Notification findNotification(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private NotificationTargetType parseTargetType(String targetType) {
        try {
            return NotificationTargetType.valueOf(targetType.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Notification target type is invalid");
        }
    }
}
