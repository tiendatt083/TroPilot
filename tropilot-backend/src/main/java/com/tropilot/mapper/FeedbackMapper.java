package com.tropilot.mapper;

import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Feedback;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
public class FeedbackMapper {

    public FeedbackResponse toResponse(Feedback feedback) {
        User residentHead = feedback.getResidentHead();
        Room room = feedback.getRoom();
        Building building = room.getBuilding();
        Invoice invoice = feedback.getInvoice();
        User repliedBy = feedback.getRepliedBy();

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .invoiceId(invoice == null ? null : invoice.getId())
                .invoiceMonth(invoice == null ? null : invoice.getMonth())
                .invoiceTotalAmount(invoice == null ? null : invoice.getTotalAmount())
                .type(feedback.getType())
                .title(feedback.getTitle())
                .content(feedback.getContent())
                .status(feedback.getStatus())
                .reply(feedback.getReply())
                .repliedById(repliedBy == null ? null : repliedBy.getId())
                .repliedByName(repliedBy == null ? null : repliedBy.getFullName())
                .repliedByRole(repliedBy == null ? null : repliedBy.getRole().name())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }
}
