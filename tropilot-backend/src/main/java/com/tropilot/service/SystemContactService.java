package com.tropilot.service;

import com.tropilot.dto.request.SystemContactUpdateRequest;
import com.tropilot.dto.response.SystemContactResponse;

public interface SystemContactService {

    SystemContactResponse getContact();

    SystemContactResponse updateContact(SystemContactUpdateRequest request);
}
