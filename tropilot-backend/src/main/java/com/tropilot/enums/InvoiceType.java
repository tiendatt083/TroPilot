package com.tropilot.enums;

/**
 * Phân biệt hóa đơn tháng thông thường với hóa đơn chốt điện nước khi kết thúc thuê.
 * Việc tách loại hóa đơn cho phép một chủ hộ có hóa đơn thuê tháng và hóa đơn chốt
 * cùng kỳ mà không làm ảnh hưởng đến hóa đơn của chủ hộ kế tiếp.
 */
public enum InvoiceType {
    REGULAR,
    FINAL_UTILITY
}
