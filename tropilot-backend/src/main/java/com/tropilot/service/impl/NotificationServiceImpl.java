package com.tropilot.service.impl;

import com.tropilot.dto.request.NotificationCreateRequest;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Notification;
import com.tropilot.entity.NotificationRead;
import com.tropilot.entity.NotificationTargetBuilding;
import com.tropilot.entity.NotificationTargetUser;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.SepayPayment;
import com.tropilot.entity.User;
import com.tropilot.enums.NotificationTargetType;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.NotificationReadRepository;
import com.tropilot.repository.NotificationRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final BuildingRepository buildingRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationCreateRequest request, Long createdById, Long buildingId) {
        User createdBy = findUser(createdById);
        NotificationTargetType targetType = parseTargetType(request.getTargetType());
        List<User> selectedUsers = resolveSelectedUsers(targetType, request);
        List<Building> selectedBuildings = resolveSelectedBuildings(targetType, request, buildingId);
        Long targetId = resolveTargetId(targetType, request.getTargetId(), buildingId);
        validateSelectedResidentHeads(targetType, selectedUsers, selectedBuildings);
        validateTarget(targetType, targetId, selectedUsers);
        validateBuildingScope(targetType, targetId, buildingId, selectedBuildings);

        Notification notification = Notification.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .targetType(targetType)
                .targetId(targetId)
                .createdBy(createdBy)
                .build();

        selectedUsers.forEach(user -> notification.getTargetUsers().add(NotificationTargetUser.builder()
                .notification(notification)
                .user(user)
                .build()));
        selectedBuildings.forEach(building -> notification.getTargetBuildings().add(NotificationTargetBuilding.builder()
                .notification(notification)
                .building(building)
                .build()));

        return notificationMapper.toResponse(notificationRepository.save(notification), null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getAdminNotifications(Long buildingId) {
        if (buildingId != null) {
            validateBuildingExists(buildingId);
        }

        List<Notification> notifications = notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(notification -> buildingId == null || isNotificationLinkedToBuilding(notification, buildingId))
                .toList();

        return notifications.stream()
                .map(notification -> notificationMapper.toResponse(notification, null))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getResidentNotifications(Long userId) {
        User user = findUser(userId);
        RoomAssignment activeAssignment = findActiveAssignment(user.getId()).orElse(null);
        if (activeAssignment == null) {
            return List.of();
        }

        Long roomId = activeAssignment.getRoom().getId();
        Long buildingId = activeAssignment.getRoom().getBuilding().getId();

        return getVisibleNotifications(
                user.getId(),
                roomId,
                buildingId
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getStaffNotifications(Long userId) {
        User user = findUser(userId);

        return getVisibleNotifications(
                user.getId(),
                null,
                null
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

    @Override
    @Transactional
    public void createContractUpdatedNotification(User createdBy, RentalContract contract) {
        if (createdBy == null) {
            throw new BadRequestException("Notification creator is required");
        }
        if (contract == null) {
            throw new BadRequestException("Rental contract is required");
        }

        Notification notification = Notification.builder()
                .title("Rental contract updated")
                .content("The rental contract for room " + contract.getRoom().getRoomCode()
                        + " has been updated. Please review the latest contract file.")
                .targetType(NotificationTargetType.SELECTED_USERS)
                .createdBy(createdBy)
                .build();

        notification.getTargetUsers().add(NotificationTargetUser.builder()
                .notification(notification)
                .user(contract.getResidentHead())
                .build());
        notification.getTargetBuildings().add(NotificationTargetBuilding.builder()
                .notification(notification)
                .building(contract.getRoom().getBuilding())
                .build());

        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void createInvoiceIssuedNotification(User createdBy, Invoice invoice, SepayPayment payment) {
        if (createdBy == null) {
            throw new BadRequestException("Notification creator is required");
        }
        if (invoice == null) {
            throw new BadRequestException("Invoice is required");
        }
        if (payment == null) {
            throw new BadRequestException("SePay payment is required");
        }

        Notification notification = Notification.builder()
                .title("New invoice issued")
                .content("Invoice " + invoice.getId() + " for room " + invoice.getRoom().getRoomCode()
                        + " is ready. Transfer exactly " + payment.getAmount().toPlainString()
                        + " with payment code " + payment.getPaymentCode() + ".")
                .targetType(NotificationTargetType.SELECTED_USERS)
                .createdBy(createdBy)
                .build();

        notification.getTargetUsers().add(NotificationTargetUser.builder()
                .notification(notification)
                .user(invoice.getResidentHead())
                .build());
        notification.getTargetBuildings().add(NotificationTargetBuilding.builder()
                .notification(notification)
                .building(invoice.getRoom().getBuilding())
                .build());

        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void createInvoicePaidNotification(User createdBy, Invoice invoice, SepayPayment payment) {
        if (createdBy == null) {
            throw new BadRequestException("Notification creator is required");
        }
        if (invoice == null) {
            throw new BadRequestException("Invoice is required");
        }
        if (payment == null) {
            throw new BadRequestException("SePay payment is required");
        }

        Notification notification = Notification.builder()
                .title("Payment received")
                .content("Payment for invoice " + invoice.getId()
                        + " in room " + invoice.getRoom().getRoomCode()
                        + " has been received successfully.")
                .targetType(NotificationTargetType.SELECTED_USERS)
                .createdBy(createdBy)
                .build();

        notification.getTargetUsers().add(NotificationTargetUser.builder()
                .notification(notification)
                .user(invoice.getResidentHead())
                .build());
        notification.getTargetBuildings().add(NotificationTargetBuilding.builder()
                .notification(notification)
                .building(invoice.getRoom().getBuilding())
                .build());

        notificationRepository.save(notification);
    }

    private List<NotificationResponse> getVisibleNotifications(
            Long userId,
            Long roomId,
            Long buildingId
    ) {
        User user = findUser(userId);
        List<Notification> notifications = notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(notification -> isVisibleToUser(notification, user, roomId, buildingId))
                .toList();

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
        Long activeRoomId = findActiveRoomId(user.getId());
        Long activeBuildingId = findActiveBuildingId(user.getId());

        return isVisibleToUser(notification, user, activeRoomId, activeBuildingId);
    }

    private boolean isVisibleToUser(Notification notification, User user, Long activeRoomId, Long activeBuildingId) {
        if (isUnassignedResidentHead(user, activeRoomId, activeBuildingId)) {
            return false;
        }

        if (!matchesNotificationTarget(notification, user, activeRoomId, activeBuildingId)) {
            return false;
        }

        return matchesBuildingScope(notification, user, activeBuildingId);
    }

    private boolean isUnassignedResidentHead(User user, Long activeRoomId, Long activeBuildingId) {
        return user.getRole() == UserRole.RESIDENT_HEAD && (activeRoomId == null || activeBuildingId == null);
    }

    private boolean matchesNotificationTarget(Notification notification, User user, Long activeRoomId, Long activeBuildingId) {
        return switch (notification.getTargetType()) {
            case ALL -> true;
            case STAFF -> user.getRole() == UserRole.STAFF;
            case ALL_RESIDENT_HEADS -> user.getRole() == UserRole.RESIDENT_HEAD;
            case SELECTED_USERS -> notification.getTargetUsers()
                    .stream()
                    .anyMatch(targetUser -> targetUser.getUser().getId().equals(user.getId()));
            case ONE_BUILDING -> activeBuildingId != null && notification.getTargetId().equals(activeBuildingId);
            case ONE_USER -> notification.getTargetId().equals(user.getId());
            case ONE_ROOM -> activeRoomId != null && notification.getTargetId().equals(activeRoomId);
        };
    }

    private boolean matchesBuildingScope(Notification notification, User user, Long activeBuildingId) {
        if (notification.getTargetBuildings().isEmpty()) {
            return true;
        }

        if (notification.getTargetType() == NotificationTargetType.SELECTED_USERS) {
            return true;
        }

        if (user.getRole() != UserRole.RESIDENT_HEAD) {
            return true;
        }

        return activeBuildingId != null && notification.getTargetBuildings()
                .stream()
                .anyMatch(targetBuilding -> targetBuilding.getBuilding().getId().equals(activeBuildingId));
    }

    private void validateTarget(NotificationTargetType targetType, Long targetId, List<User> selectedUsers) {
        switch (targetType) {
            case ALL, ALL_RESIDENT_HEADS, STAFF -> {
                if (targetId != null) {
                    throw new BadRequestException("Target ID must be empty for this notification target");
                }
            }
            case SELECTED_USERS -> {
                if (selectedUsers.isEmpty()) {
                    throw new BadRequestException("At least one Head Resident is required");
                }
            }
            case ONE_BUILDING -> {
                if (targetId == null) {
                    throw new BadRequestException("Target building is required");
                }
                validateBuildingExists(targetId);
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

    private Long resolveTargetId(NotificationTargetType targetType, Long targetId, Long buildingId) {
        return switch (targetType) {
            case ALL, ALL_RESIDENT_HEADS, STAFF -> null;
            case SELECTED_USERS -> null;
            case ONE_BUILDING -> targetId == null ? buildingId : targetId;
            case ONE_ROOM, ONE_USER -> targetId;
        };
    }

    private void validateBuildingScope(
            NotificationTargetType targetType,
            Long targetId,
            Long buildingId,
            List<Building> selectedBuildings
    ) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!selectedBuildings.isEmpty() && selectedBuildings.stream().anyMatch(building -> !Objects.equals(building.getId(), buildingId))) {
            throw new BadRequestException("Notification target building must match the selected building");
        }

        switch (targetType) {
            case ONE_BUILDING -> {
                if (!Objects.equals(targetId, buildingId)) {
                    throw new BadRequestException("Notification target building must match the selected building");
                }
            }
            case ONE_ROOM -> {
                if (!roomRepository.findById(targetId)
                        .map(room -> Objects.equals(room.getBuilding().getId(), buildingId))
                        .orElse(false)) {
                    throw new BadRequestException("Notification target room does not belong to the selected building");
                }
            }
            default -> {
            }
        }
    }

    private List<User> resolveSelectedUsers(NotificationTargetType targetType, NotificationCreateRequest request) {
        if (targetType != NotificationTargetType.SELECTED_USERS) {
            return List.of();
        }

        List<Long> userIds = normalizeIds(request.getTargetUserIds());

        if (userIds.isEmpty() && request.getTargetId() != null) {
            userIds = List.of(request.getTargetId());
        }

        if (userIds.isEmpty()) {
            return List.of();
        }

        List<User> users = userRepository.findAllById(userIds);
        if (users.size() != userIds.size()) {
            throw new ResourceNotFoundException("Target Head Resident not found");
        }

        return users;
    }

    private void validateSelectedResidentHeads(
            NotificationTargetType targetType,
            List<User> selectedUsers,
            List<Building> selectedBuildings
    ) {
        if (targetType != NotificationTargetType.SELECTED_USERS) {
            return;
        }

        boolean hasInvalidRole = selectedUsers.stream()
                .anyMatch(user -> user.getRole() != UserRole.RESIDENT_HEAD);
        if (hasInvalidRole) {
            throw new BadRequestException("Only Head Residents can be selected as notification recipients");
        }

        if (selectedBuildings.isEmpty()) {
            return;
        }

        Set<Long> selectedBuildingIds = selectedBuildings.stream()
                .map(Building::getId)
                .collect(Collectors.toSet());

        boolean hasResidentOutsideSelectedBuildings = selectedUsers.stream()
                .anyMatch(user -> findActiveAssignment(user.getId())
                        .map(assignment -> assignment.getRoom().getBuilding().getId())
                        .filter(selectedBuildingIds::contains)
                        .isEmpty());

        if (hasResidentOutsideSelectedBuildings) {
            throw new BadRequestException("Selected Head Resident does not belong to selected buildings");
        }
    }

    private List<Building> resolveSelectedBuildings(
            NotificationTargetType targetType,
            NotificationCreateRequest request,
            Long buildingId
    ) {
        if (targetType == NotificationTargetType.STAFF) {
            return List.of();
        }

        if (buildingId != null) {
            return List.of(findBuilding(buildingId));
        }

        String buildingTargetType = request.getBuildingTargetType();
        List<Long> buildingIds = normalizeIds(request.getBuildingIds());

        if (buildingTargetType == null || buildingTargetType.isBlank()) {
            return buildingIds.isEmpty() ? List.of() : findBuildings(buildingIds);
        }

        String normalizedType = buildingTargetType.trim().toUpperCase(Locale.ROOT);

        if ("ALL".equals(normalizedType)) {
            return List.of();
        }

        if ("SELECTED".equals(normalizedType)) {
            if (buildingIds.isEmpty()) {
                throw new BadRequestException("At least one target building is required");
            }
            return findBuildings(buildingIds);
        }

        throw new BadRequestException("Notification building target type is invalid");
    }

    private List<Long> normalizeIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        return ids.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(LinkedHashSet::new),
                        List::copyOf
                ));
    }

    private List<Building> findBuildings(List<Long> buildingIds) {
        List<Building> buildings = buildingRepository.findAllById(buildingIds);
        if (buildings.size() != buildingIds.size()) {
            throw new ResourceNotFoundException("Building not found");
        }

        return buildings;
    }

    private Building findBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found"));
    }

    private boolean isNotificationLinkedToBuilding(Notification notification, Long buildingId) {
        if (notification.getTargetBuildings().isEmpty()
                && notification.getTargetType() != NotificationTargetType.ONE_BUILDING
                && notification.getTargetType() != NotificationTargetType.ONE_ROOM) {
            return true;
        }

        if (notification.getTargetBuildings()
                .stream()
                .anyMatch(targetBuilding -> targetBuilding.getBuilding().getId().equals(buildingId))) {
            return true;
        }

        if (notification.getTargetType() == NotificationTargetType.ONE_BUILDING) {
            return Objects.equals(notification.getTargetId(), buildingId);
        }

        if (notification.getTargetType() == NotificationTargetType.ONE_ROOM) {
            return roomRepository.findById(notification.getTargetId())
                    .map(room -> Objects.equals(room.getBuilding().getId(), buildingId))
                    .orElse(false);
        }

        return false;
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private Long findActiveRoomId(Long residentHeadId) {
        return findActiveAssignment(residentHeadId)
                .map(RoomAssignment::getRoom)
                .map(room -> room.getId())
                .orElse(null);
    }

    private Long findActiveBuildingId(Long residentHeadId) {
        return findActiveAssignment(residentHeadId)
                .map(RoomAssignment::getRoom)
                .map(room -> room.getBuilding().getId())
                .orElse(null);
    }

    private Optional<RoomAssignment> findActiveAssignment(Long residentHeadId) {
        return roomAssignmentRepository.findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE);
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
