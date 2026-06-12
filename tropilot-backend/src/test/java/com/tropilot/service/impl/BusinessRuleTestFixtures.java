package com.tropilot.service.impl;

import com.tropilot.entity.Building;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.ServiceFee;
import com.tropilot.entity.User;
import com.tropilot.enums.CalculationType;
import com.tropilot.enums.ContractStatus;
import com.tropilot.enums.FeeType;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

final class BusinessRuleTestFixtures {

    static final Long BUILDING_ID = 1L;
    static final Long ROOM_ID = 10L;
    static final Long RESIDENT_ID = 20L;
    static final Long ADMIN_ID = 30L;

    private BusinessRuleTestFixtures() {
    }

    static Building building() {
        return Building.builder()
                .id(BUILDING_ID)
                .buildingCode("BD01")
                .name("Building 01")
                .address("Demo address")
                .floors(5)
                .build();
    }

    static Room room(RoomStatus status) {
        return Room.builder()
                .id(ROOM_ID)
                .building(building())
                .roomCode("BD01-P101")
                .roomName("Room 101")
                .floor(1)
                .price(new BigDecimal("5000000"))
                .area(new BigDecimal("30"))
                .maxOccupants(3)
                .status(status)
                .build();
    }

    static User residentHead() {
        return User.builder()
                .id(RESIDENT_ID)
                .fullName("Resident Head")
                .email("resident@test.local")
                .phone("0900000001")
                .password("hashed")
                .role(UserRole.RESIDENT_HEAD)
                .status(UserStatus.ACTIVE)
                .build();
    }

    static User admin() {
        return User.builder()
                .id(ADMIN_ID)
                .fullName("Admin")
                .email("admin@test.local")
                .password("hashed")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
    }

    static RoomAssignment activeAssignment(Room room, User residentHead) {
        return RoomAssignment.builder()
                .id(100L)
                .room(room)
                .residentHead(residentHead)
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(5))
                .status(RoomAssignmentStatus.ACTIVE)
                .build();
    }

    static RentalContract activeContract(Room room, User residentHead) {
        return RentalContract.builder()
                .id(200L)
                .room(room)
                .residentHead(residentHead)
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(5))
                .depositAmount(room.getPrice())
                .rentalStatus(RentalStatus.ACTIVE)
                .contractStatus(ContractStatus.NOT_UPLOADED)
                .build();
    }

    static ServiceFee serviceFee(Long id, String name, FeeType feeType, CalculationType calculationType, String unitPrice) {
        return ServiceFee.builder()
                .id(id)
                .building(building())
                .name(name)
                .feeCode(name.toUpperCase().replace(" ", "_"))
                .feeType(feeType)
                .calculationType(calculationType)
                .unitPrice(new BigDecimal(unitPrice))
                .isActive(true)
                .build();
    }

    static Invoice invoice(Room room, User residentHead, User createdBy, InvoiceStatus status) {
        return Invoice.builder()
                .id(300L)
                .room(room)
                .residentHead(residentHead)
                .createdBy(createdBy)
                .month(LocalDate.of(2026, 6, 1))
                .dueDate(LocalDate.of(2026, 6, 5))
                .status(status)
                .totalAmount(new BigDecimal("10500000"))
                .build();
    }
}
