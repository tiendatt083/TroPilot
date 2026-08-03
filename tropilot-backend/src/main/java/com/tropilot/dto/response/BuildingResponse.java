package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
/** Thông tin tòa nhà để hiển thị: mã, tên, địa chỉ, số tầng và các mốc tạo/sửa. */
public class BuildingResponse {

    private Long id;
    private String buildingCode;
    private String name;
    private String address;
    private Integer floors;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
