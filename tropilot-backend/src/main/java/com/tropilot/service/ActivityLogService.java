package com.tropilot.service;

import com.tropilot.dto.response.ActivityLogResponse;
import com.tropilot.entity.User;

import java.util.List;

/** Hợp đồng ghi và tra cứu nhật ký hoạt động của người dùng trong hệ thống. */
public interface ActivityLogService {

    void record(User user, String action, String description);

    void record(Long userId, String action, String description);

    void recordCurrentUser(String action, String description);

    List<ActivityLogResponse> getLogs(String query);

    List<ActivityLogResponse> getMyLogs(Long userId, String query);
}
