package com.tropilot.controller;

import com.tropilot.dto.request.SystemContactUpdateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.SystemContactResponse;
import com.tropilot.service.SystemContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/contact")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
/**
 * API cập nhật thông tin liên hệ chung của hệ thống.
 * PUT / nhận thông tin mới và trả lại bản ghi đã cập nhật để frontend hiển thị ngay.
 */
public class AdminSystemContactController {

    private final SystemContactService systemContactService;

    @PutMapping
    public ApiResponse<SystemContactResponse> updateContact(
            @Valid @RequestBody SystemContactUpdateRequest request
    ) {
        return ApiResponse.success(
                "System contact information updated successfully",
                systemContactService.updateContact(request)
        );
    }
}
