package com.tropilot.service.impl;

import com.tropilot.mapper.ActivityLogMapper;
import com.tropilot.dto.response.ActivityLogResponse;
import com.tropilot.entity.ActivityLog;
import com.tropilot.entity.User;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.ActivityLogRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
/** Ghi nhận thao tác người dùng và cung cấp lịch sử hoạt động có thể tìm kiếm. */
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final ActivityLogMapper activityLogMapper;

    @Override
    @Transactional
    /** Lưu một thao tác của entity User đã có sẵn; bỏ qua nếu không có người dùng. */
    public void record(User user, String action, String description) {
        if (user == null) {
            throw new UnauthorizedException("Activity log user is required");
        }

        activityLogRepository.save(ActivityLog.builder()
                .user(user)
                .action(normalizeAction(action))
                .description(normalizeDescription(description))
                .build());
    }

    @Override
    @Transactional
    /** Tìm người dùng theo id rồi ghi nhật ký thao tác cho họ. */
    public void record(Long userId, String action, String description) {
        record(findUser(userId), action, description);
    }

    @Override
    @Transactional
    /** Ghi nhật ký cho người dùng đang gửi request hiện tại. */
    public void recordCurrentUser(String action, String description) {
        record(getCurrentUser(), action, description);
    }

    @Override
    @Transactional(readOnly = true)
    /** Lấy toàn bộ nhật ký hoặc tìm theo từ khóa sau khi chuẩn hóa dữ liệu tìm kiếm. */
    public List<ActivityLogResponse> getLogs(String query) {
        String normalizedQuery = normalizeOptionalQuery(query);

        return (normalizedQuery == null
                ? activityLogRepository.findAllByOrderByCreatedAtDesc()
                : activityLogRepository.searchByQuery(normalizedQuery))
                .stream()
                .map(activityLogMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    /** Lấy lịch sử thao tác của một người dùng, có hỗ trợ tìm theo từ khóa. */
    public List<ActivityLogResponse> getMyLogs(Long userId, String query) {
        String normalizedQuery = normalizeOptionalQuery(query);

        return (normalizedQuery == null
                ? activityLogRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                : activityLogRepository.searchByUserIdAndQuery(
                        userId,
                        normalizedQuery
                ))
                .stream()
                .map(activityLogMapper::toResponse)
                .toList();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();

        if (principal instanceof AuthenticatedUser authenticatedUser) {
            return findUser(authenticatedUser.getId());
        }

        throw new UnauthorizedException("Authentication is required");
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String normalizeAction(String action) {
        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("Activity log action is required");
        }

        return action.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptionalQuery(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }

        return query.trim();
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Activity log description is required");
        }

        return description.trim();
    }
}
