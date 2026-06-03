package com.tropilot.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class SepayWebhookRequest {

    @JsonAlias({"id", "transactionId", "transaction_id"})
    private String transactionId;

    private String gateway;

    @JsonAlias({"transactionDate", "transaction_date"})
    private String transactionDate;

    @JsonAlias({"accountNumber", "account_number"})
    private String accountNumber;

    private String code;

    @JsonAlias({"content", "description"})
    private String content;

    @JsonAlias({"transferType", "transfer_type"})
    private String transferType;

    @JsonAlias({"transferAmount", "transfer_amount"})
    private BigDecimal transferAmount;

    @JsonAlias({"referenceCode", "reference_code"})
    private String referenceCode;
}
