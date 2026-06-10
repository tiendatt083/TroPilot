package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EquipmentDeleteResponse {

    private Long id;
    private boolean deleted;
    private boolean deactivated;
}
