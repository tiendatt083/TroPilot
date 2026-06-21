package com.tropilot.service;

import com.tropilot.entity.Task;

public interface TaskEmailService {

    void sendTaskAssignedEmail(Task task);
}
