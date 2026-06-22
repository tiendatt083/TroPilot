package com.tropilot.mapper;

import com.tropilot.dto.response.UserResponse;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.util.TemporaryPasswordCipher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final TemporaryPasswordCipher temporaryPasswordCipher;

    public UserResponse toResponse(User user) {
        return toResponse(user, false);
    }

    public UserResponse toResponse(User user, RoomAssignment activeAssignment) {
        return toResponse(user, false, activeAssignment);
    }

    public UserResponse toAdminResponse(User user) {
        return toResponse(user, true, null);
    }

    public UserResponse toAdminResponse(User user, RoomAssignment activeAssignment) {
        return toResponse(user, true, activeAssignment);
    }

    private UserResponse toResponse(User user, boolean includeTemporaryPassword) {
        return toResponse(user, includeTemporaryPassword, null);
    }

    private UserResponse toResponse(User user, boolean includeTemporaryPassword, RoomAssignment activeAssignment) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .mustChangePassword(user.isMustChangePassword())
                .temporaryPassword(resolveTemporaryPassword(user, includeTemporaryPassword))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());

        if (activeAssignment != null) {
            Room room = activeAssignment.getRoom();
            builder.assignedRoomId(room.getId())
                    .assignedRoomCode(room.getRoomCode())
                    .assignedRoomName(room.getRoomName())
                    .assignedBuildingId(room.getBuilding().getId())
                    .assignedBuildingCode(room.getBuilding().getBuildingCode())
                    .assignedBuildingName(room.getBuilding().getName());
        }

        return builder.build();
    }

    private String resolveTemporaryPassword(User user, boolean includeTemporaryPassword) {
        if (!includeTemporaryPassword || !user.isMustChangePassword()) {
            return null;
        }

        String encryptedPassword = user.getTemporaryPasswordEncrypted();
        if (encryptedPassword == null || encryptedPassword.isBlank()) {
            return null;
        }

        return temporaryPasswordCipher.decrypt(encryptedPassword);
    }
}
