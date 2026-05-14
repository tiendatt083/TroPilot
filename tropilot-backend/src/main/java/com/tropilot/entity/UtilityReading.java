package com.tropilot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "utility_readings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_utility_readings_room_month",
                columnNames = {"room_id", "reading_month"}
        )
)
public class UtilityReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "reading_month", nullable = false)
    private LocalDate month;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal oldElectricity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal newElectricity;

    @Column(nullable = false, length = 500)
    private String electricityImageUrl;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal oldWater;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal newWater;

    @Column(nullable = false, length = 500)
    private String waterImageUrl;

    @Column(length = 1000)
    private String editReason;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

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
