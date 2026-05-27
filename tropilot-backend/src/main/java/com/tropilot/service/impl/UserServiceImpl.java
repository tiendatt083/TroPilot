package com.tropilot.service.impl;

import com.tropilot.dto.request.AdminCreateUserRequest;
import com.tropilot.dto.request.AdminUpdateUserRequest;
import com.tropilot.dto.response.PasswordResetResponse;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String TEMPORARY_PASSWORD_CHARACTERS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private static final int GENERATED_PASSWORD_LENGTH = 12;

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

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already in use");
        }

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
                .map(user -> userMapper.toAdminResponse(user, activeAssignments.get(user.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUser(Long id) {
        return userMapper.toAdminResponse(findUser(id));
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, AdminUpdateUserRequest request) {
        User user = findUser(id);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String email = normalizeEmail(request.getEmail());
            userRepository.findByEmail(email)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BadRequestException("Email is already in use");
                    });
            user.setEmail(email);
        }

        if (request.getPhone() != null) {
            user.setPhone(normalizeOptionalText(request.getPhone()));
        }

        if (request.getRole() != null) {
            validateRoleUpdate(user, request.getRole());
            user.setRole(request.getRole());
        }

        if (request.getStatus() != null) {
            if (user.getRole() == UserRole.ADMIN && request.getStatus() != UserStatus.ACTIVE) {
                throw new BadRequestException("Admin account status cannot be changed");
            }
            user.setStatus(request.getStatus());
        }

        return userMapper.toAdminResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse lockUser(Long id) {
        User user = findUser(id);
        preventAdminStatusChange(user);
        user.setStatus(UserStatus.LOCKED);
        return userMapper.toAdminResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse unlockUser(Long id) {
        User user = findUser(id);
        user.setStatus(UserStatus.ACTIVE);
        return userMapper.toAdminResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public PasswordResetResponse resetPassword(Long id) {
        User user = findUser(id);
        preventAdminPasswordReset(user);

        String temporaryPassword = generateTemporaryPassword();
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setTemporaryPasswordEncrypted(temporaryPasswordCipher.encrypt(temporaryPassword));
        user.setMustChangePassword(true);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        activityLogService.recordCurrentUser("USER_PASSWORD_RESET", "Reset temporary password for " + user.getEmail());

        return PasswordResetResponse.builder()
                .userId(user.getId())
                .temporaryPassword(temporaryPassword)
                .build();
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = findUser(id);
        preventAdminDelete(user);
        String email = user.getEmail();

        try {
            userRepository.delete(user);
            userRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new BadRequestException("User cannot be deleted because it has related system data");
        }

        activityLogService.recordCurrentUser("USER_DELETED", "Deleted user account for " + email);
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

    private void validateRoleUpdate(User user, UserRole requestedRole) {
        if (user.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("Admin account role cannot be changed");
        }

        validateAssignableRole(requestedRole);
    }

    private void preventAdminStatusChange(User user) {
        if (user.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("Admin account cannot be locked");
        }
    }

    private void preventAdminPasswordReset(User user) {
        if (user.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("Admin password cannot be reset through this API");
        }
    }

    private void preventAdminDelete(User user) {
        if (user.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("Admin account cannot be deleted");
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
