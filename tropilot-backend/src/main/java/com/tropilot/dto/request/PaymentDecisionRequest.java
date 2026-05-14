package com.tropilot.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentDecisionRequest {

    @Size(max = 1000, message = "Payment note must not exceed 1000 characters")
    private String note;
}
