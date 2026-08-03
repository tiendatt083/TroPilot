package com.tropilot.service;

import com.tropilot.dto.request.SystemContactUpdateRequest;
import com.tropilot.dto.response.SystemContactResponse;

/** Hợp đồng xem và cập nhật thông tin liên hệ chung của ban quản lý. */
public interface SystemContactService {

    SystemContactResponse getContact();

    SystemContactResponse updateContact(SystemContactUpdateRequest request);
}
