package com.tropilot.service.impl;

import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
public class RentalContractMapper {

    public RentalContractResponse toResponse(RentalContract contract) {
        Room room = contract.getRoom();
        Building building = room.getBuilding();
        User residentHead = contract.getResidentHead();

        return RentalContractResponse.builder()
                .id(contract.getId())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .depositAmount(contract.getDepositAmount())
                .rentalStatus(contract.getRentalStatus())
                .contractFileUrl(contract.getContractFileUrl())
                .contractStatus(contract.getContractStatus())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }
}
