package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.SystemContactResponse;
import com.tropilot.service.SystemContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class SystemContactController {

    private final SystemContactService systemContactService;

    @GetMapping
    public ApiResponse<SystemContactResponse> getContact() {
        return ApiResponse.success(
                "System contact information loaded successfully",
                systemContactService.getContact()
        );
    }
}
