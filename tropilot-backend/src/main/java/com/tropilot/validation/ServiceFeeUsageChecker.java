package com.tropilot.validation;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
/**
 * Kiểm tra một khoản phí đã được dùng trong dòng hóa đơn hay chưa.
 * Dùng JdbcTemplate để tương thích cả với cơ sở dữ liệu cũ chưa có cột service_fee_id.
 */
public class ServiceFeeUsageChecker {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Trả về true khi khoản phí đã xuất hiện trong invoice_items; khi schema cũ chưa có cột liên quan thì trả về false.
     */
    public boolean hasInvoiceItems(Long serviceFeeId) {
        if (!invoiceItemsTableHasServiceFeeColumn()) {
            return false;
        }

        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from invoice_items where service_fee_id = ?",
                Integer.class,
                serviceFeeId
        );

        return count != null && count > 0;
    }

    /** Kiểm tra schema hiện tại có cột invoice_items.service_fee_id trước khi thực hiện truy vấn sử dụng cột đó. */
    private boolean invoiceItemsTableHasServiceFeeColumn() {
        Integer count = jdbcTemplate.queryForObject(
                """
                        select count(*)
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = 'invoice_items'
                          and column_name = 'service_fee_id'
                        """,
                Integer.class
        );

        return count != null && count > 0;
    }
}
