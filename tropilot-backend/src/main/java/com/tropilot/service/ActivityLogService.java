package com.tropilot.service;

import com.tropilot.dto.response.ActivityLogResponse;
import com.tropilot.entity.User;

import java.util.List;

public interface ActivityLogService {

    void record(User user, String action, String description);

    void record(Long userId, String action, String description);

    void recordCurrentUser(String action, String description);

    List<ActivityLogResponse> getLogs(String action);

    List<ActivityLogResponse> getMyLogs(Long userId, String action);
}
