package com.tropilot.service;

import com.tropilot.entity.User;

/** Hợp đồng xây dựng ngữ cảnh nghiệp vụ an toàn để gửi cho trợ lý chat AI. */
public interface ChatContextService {

    String buildContext(User user, String message);
}
