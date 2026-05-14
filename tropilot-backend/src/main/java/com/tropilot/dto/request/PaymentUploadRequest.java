package com.tropilot.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class PaymentUploadRequest {

    @NotNull(message = "Invoice is required")
    private Long invoiceId;

    @NotNull(message = "Payment proof file is required")
    private MultipartFile proofImage;

    @Size(max = 1000, message = "Payment note must not exceed 1000 characters")
    private String note;
}
