package com.tropilot.mapper;

import com.tropilot.dto.response.ActivityLogResponse;
import com.tropilot.entity.ActivityLog;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
/**
 * Chuyển bản ghi nhật ký hoạt động trong cơ sở dữ liệu thành dữ liệu trả về cho client.
 * Mapper lấy thêm thông tin người thực hiện để giao diện không cần tự tra cứu người dùng.
 */
public class ActivityLogMapper {

    /**
     * Ghép thông tin hành động, thời điểm tạo và người dùng liên quan vào ActivityLogResponse.
     */
    public ActivityLogResponse toResponse(ActivityLog log) {
        User user = log.getUser();

        return ActivityLogResponse.builder()
                .id(log.getId())
                .userId(user.getId())
                .userFullName(user.getFullName())
                .userEmail(user.getEmail())
                .userRole(user.getRole())
                .action(log.getAction())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
