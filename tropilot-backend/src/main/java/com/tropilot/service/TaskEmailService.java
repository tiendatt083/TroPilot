package com.tropilot.service;

import com.tropilot.entity.Task;

/** Hợp đồng gửi email khi nhân viên được phân công công việc. */
public interface TaskEmailService {

    void sendTaskAssignedEmail(Task task);
}
