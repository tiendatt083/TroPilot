package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
/** Một file hợp đồng cũ và thông tin file/thời điểm đã thay thế nó. */
public class ContractFileHistoryResponse {

    private Long id;
    private String fileUrl;
    private Long replacedById;
    private String replacedByName;
    private LocalDateTime replacedAt;
}
