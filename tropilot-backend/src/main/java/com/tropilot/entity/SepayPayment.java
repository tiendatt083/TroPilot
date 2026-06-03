package com.tropilot.entity;

import com.tropilot.enums.SepayPaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sepay_payments")
public class SepayPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false, unique = true)
    private Invoice invoice;

    @Column(nullable = false, unique = true, length = 80)
    private String paymentCode;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 80)
    private String bankCode;

    @Column(nullable = false, length = 80)
    private String accountNumber;

    @Column(nullable = false, length = 160)
    private String accountName;

    @Column(nullable = false, length = 500)
    private String qrImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SepayPaymentStatus status;

    @Column(length = 120)
    private String sepayTransactionId;

    @Column(length = 120)
    private String referenceCode;

    @Column(precision = 14, scale = 2)
    private BigDecimal paidAmount;

    private LocalDateTime paidAt;

    @Column(length = 1000)
    private String webhookContent;

    @Column(length = 500)
    private String lastWebhookError;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
