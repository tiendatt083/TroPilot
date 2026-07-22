package com.tropilot.service.impl;

import com.tropilot.mapper.UserMapper;
import com.tropilot.dto.request.AdminCreateUserRequest;
import com.tropilot.dto.response.UserResponse;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.UserService;
import com.tropilot.util.TemporaryPasswordCipher;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String TEMPORARY_PASSWORD_CHARACTERS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private static final int GENERATED_PASSWORD_LENGTH = 12;
    private static final String ARCHIVED_EMAIL_DOMAIN = "tropilot.invalid";

    private final UserRepository userRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final TemporaryPasswordCipher temporaryPasswordCipher;
    private final ActivityLogService activityLogService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public UserResponse createUser(AdminCreateUserRequest request) {
        validateAssignableRole(request.getRole());
        String email = normalizeEmail(request.getEmail());
        releaseEmailFromInactiveAccountOrReject(email);

        String temporaryPassword = generateTemporaryPassword();

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .phone(normalizeOptionalText(request.getPhone()))
                .password(passwordEncoder.encode(temporaryPassword))
                .temporaryPasswordEncrypted(temporaryPasswordCipher.encrypt(temporaryPassword))
                .role(request.getRole())
                .status(UserStatus.ACTIVE)
                .mustChangePassword(true)
                .build();

        User savedUser = userRepository.save(user);
        activityLogService.recordCurrentUser(
                "USER_CREATED",
                "Created " + savedUser.getRole().name() + " account for " + savedUser.getEmail()
        );

        return userMapper.toAdminResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();
        Map<Long, RoomAssignment> activeAssignments = findActiveResidentHeadAssignments(users);

        return users
                .stream()
                .filter(user -> user.getStatus() != UserStatus.INACTIVE)
                .map(user -> userMapper.toAdminResponse(user, activeAssignments.get(user.getId())))
                .toList();
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = findUser(id);
        String deletedEmail = user.getEmail();

        if (user.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("Admin account cannot be deleted");
        }

        if (user.getRole() == UserRole.RESIDENT_HEAD
                && roomAssignmentRepository.existsByResidentHead_IdAndStatus(id, RoomAssignmentStatus.ACTIVE)) {
            throw new BadRequestException("Head resident must be removed from the active room before deletion");
        }

        user.setStatus(UserStatus.INACTIVE);
        user.setEmail(createArchivedEmail(user.getId()));
        user.setTemporaryPasswordEncrypted(null);
        user.setMustChangePassword(false);
        userRepository.save(user);
        activityLogService.recordCurrentUser("USER_DELETED", "Deleted user account for " + deletedEmail);
    }

    private void releaseEmailFromInactiveAccountOrReject(String email) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isEmpty()) {
            return;
        }

        User user = existingUser.get();
        if (user.getStatus() != UserStatus.INACTIVE) {
            throw new BadRequestException("Email is already in use");
        }

        user.setEmail(createArchivedEmail(user.getId()));
        userRepository.saveAndFlush(user);
    }

    private String createArchivedEmail(Long userId) {
        return "deleted-" + userId + "-" + UUID.randomUUID().toString().replace("-", "")
                + "@" + ARCHIVED_EMAIL_DOMAIN;
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Map<Long, RoomAssignment> findActiveResidentHeadAssignments(List<User> users) {
        List<Long> residentHeadIds = users.stream()
                .filter(user -> user.getRole() == UserRole.RESIDENT_HEAD)
                .map(User::getId)
                .toList();

        if (residentHeadIds.isEmpty()) {
            return Map.of();
        }

        return roomAssignmentRepository
                .findAllByResidentHeadIdInAndStatus(residentHeadIds, RoomAssignmentStatus.ACTIVE)
                .stream()
                .collect(Collectors.toMap(
                        assignment -> assignment.getResidentHead().getId(),
                        Function.identity(),
                        (existing, replacement) -> existing
                ));
    }

    private void validateAssignableRole(UserRole role) {
        if (role == UserRole.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be created through this API");
        }
    }

    private String generateTemporaryPassword() {
        StringBuilder builder = new StringBuilder(GENERATED_PASSWORD_LENGTH);

        for (int i = 0; i < GENERATED_PASSWORD_LENGTH; i++) {
            int index = secureRandom.nextInt(TEMPORARY_PASSWORD_CHARACTERS.length());
            builder.append(TEMPORARY_PASSWORD_CHARACTERS.charAt(index));
        }

        return builder.toString();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
