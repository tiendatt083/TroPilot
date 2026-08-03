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
/**
 * Chuyển entity User thành dữ liệu trả về cho API.
 * Mapper kiểm soát việc có được trả mật khẩu tạm hay không để tránh lộ thông tin nhạy cảm cho các API thông thường.
 */
public class UserMapper {

    private final TemporaryPasswordCipher temporaryPasswordCipher;

    /**
     * Chuyển người dùng cho các API thông thường; mật khẩu tạm luôn bị ẩn.
     */
    public UserResponse toResponse(User user) {
        return toResponse(user, false);
    }

    /**
     * Chuyển người dùng và thêm thông tin phân phòng đang hiệu lực; mật khẩu tạm vẫn bị ẩn.
     */
    public UserResponse toResponse(User user, RoomAssignment activeAssignment) {
        return toResponse(user, false, activeAssignment);
    }

    /**
     * Chuyển người dùng cho màn hình quản trị; chỉ trả mật khẩu tạm khi tài khoản vẫn bắt buộc đổi mật khẩu.
     */
    public UserResponse toAdminResponse(User user) {
        return toResponse(user, true, null);
    }

    /**
     * Phiên bản cho quản trị có thêm thông tin phân phòng đang hiệu lực.
     */
    public UserResponse toAdminResponse(User user, RoomAssignment activeAssignment) {
        return toResponse(user, true, activeAssignment);
    }

    /** Chuyển người dùng không kèm phân phòng; dùng nội bộ để tái sử dụng quy tắc chung. */
    private UserResponse toResponse(User user, boolean includeTemporaryPassword) {
        return toResponse(user, includeTemporaryPassword, null);
    }

    /**
     * Tạo UserResponse đầy đủ, tùy theo quyền gọi API mà có thể thêm mật khẩu tạm và phân phòng hiện tại.
     */
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

    /**
     * Chỉ giải mã mật khẩu tạm cho luồng quản trị và khi người dùng vẫn phải đổi mật khẩu.
     * Các trường hợp khác trả về null để bảo vệ dữ liệu nhạy cảm.
     */
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
