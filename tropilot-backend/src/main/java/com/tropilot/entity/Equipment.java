package com.tropilot.entity;

import com.tropilot.enums.EquipmentCondition;
import com.tropilot.enums.EquipmentScope;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "equipment",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_equipment_building_code",
                columnNames = {"building_id", "equipment_code"}
        )
)
/** Thiết bị thuộc Building và có thể gắn Room; lưu phạm vi, tình trạng, số lượng và lịch bảo trì. */
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(name = "equipment_code", nullable = false, length = 60)
    private String equipmentCode;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EquipmentScope scope;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 120)
    private String brand;

    @Column(length = 120)
    private String model;

    @Column(length = 255)
    private String locationDescription;

    @Column(nullable = false)
    private LocalDate addedDate;

    private LocalDate installationDate;

    private LocalDate lastMaintenanceDate;

    private LocalDate nextMaintenanceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", nullable = false, length = 30)
    private EquipmentCondition condition;

    @Column(length = 1200)
    private String note;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (addedDate == null) {
            addedDate = LocalDate.now();
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
