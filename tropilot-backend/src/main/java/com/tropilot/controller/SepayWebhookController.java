package com.tropilot.controller;

import com.tropilot.dto.request.SepayWebhookRequest;
import com.tropilot.service.SepayPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/sepay")
@RequiredArgsConstructor
public class SepayWebhookController {

    private final SepayPaymentService sepayPaymentService;

    @PostMapping("/webhook")
    public Map<String, Boolean> handleWebhook(
            @RequestBody SepayWebhookRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        sepayPaymentService.handleWebhook(request, authorizationHeader);
        return Map.of("success", true);
    }
}
