package com.tropilot.service;

import com.tropilot.entity.User;

public interface ChatContextService {

    String buildContext(User user, String message);
}
