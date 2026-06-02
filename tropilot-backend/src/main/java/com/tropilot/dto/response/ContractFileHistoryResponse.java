package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ContractFileHistoryResponse {

    private Long id;
    private String fileUrl;
    private Long replacedById;
    private String replacedByName;
    private LocalDateTime replacedAt;
}
