package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ServiceFeeDeleteResponse {

    private Long id;
    private boolean deleted;
    private boolean deactivated;
    private Boolean isActive;
}
