package com.tropilot.mapper;

import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import com.tropilot.entity.UtilityReading;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class InvoiceMapperTest {

    private final InvoiceMapper mapper = new InvoiceMapper(new SepayPaymentMapper());

    @Test
    void toResponseIncludesInvoiceDateAndUsedUtilityMonth() {
        Building building = Building.builder()
                .id(1L)
                .buildingCode("BD01")
                .name("Building 01")
                .build();
        Room room = Room.builder()
                .id(10L)
                .building(building)
                .roomCode("BD01-P101")
                .roomName("Room 101")
                .status(RoomStatus.OCCUPIED)
                .build();
        User residentHead = user(20L, "Resident Head", UserRole.RESIDENT_HEAD);
        User admin = user(30L, "Admin", UserRole.ADMIN);
        Invoice invoice = Invoice.builder()
                .id(40L)
                .room(room)
                .residentHead(residentHead)
                .createdBy(admin)
                .invoiceDate(LocalDate.of(2026, 6, 3))
                .month(LocalDate.of(2026, 6, 1))
                .dueDate(LocalDate.of(2026, 6, 5))
                .status(InvoiceStatus.UNPAID)
                .totalAmount(new BigDecimal("5000000"))
                .build();
        UtilityReading reading = UtilityReading.builder()
                .id(50L)
                .room(room)
                .month(LocalDate.of(2026, 5, 1))
                .build();

        InvoiceResponse response = mapper.toResponse(invoice, reading);

        assertThat(response.getInvoiceDate()).isEqualTo(LocalDate.of(2026, 6, 3));
        assertThat(response.getMonth()).isEqualTo("2026-06");
        assertThat(response.getUtilityMonth()).isEqualTo("2026-05");
    }

    private User user(Long id, String fullName, UserRole role) {
        return User.builder()
                .id(id)
                .fullName(fullName)
                .email(fullName.toLowerCase().replace(" ", ".") + "@test.local")
                .password("hashed")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
    }
}
