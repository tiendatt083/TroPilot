package com.tropilot.service;

import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;

import java.util.Map;

public interface ChatRoleContextBuilder {

    UserRole getSupportedRole();

    Map<String, Object> build(User user);
}
