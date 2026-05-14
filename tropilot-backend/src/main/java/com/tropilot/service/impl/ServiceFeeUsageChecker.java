package com.tropilot.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ServiceFeeUsageChecker {

    private final JdbcTemplate jdbcTemplate;

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
