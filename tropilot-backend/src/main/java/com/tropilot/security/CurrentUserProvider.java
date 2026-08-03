package com.tropilot.security;

import com.tropilot.entity.User;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
/**
 * Cung cấp entity User đầy đủ của người đang gửi request.
 * Lớp lấy thông tin xác thực từ SecurityContext rồi truy vấn lại cơ sở dữ liệu để có dữ liệu người dùng hiện tại.
 */
public class CurrentUserProvider {

    private final UserRepository userRepository;

    /**
     * Lấy User của request hiện tại. Nếu chưa đăng nhập trả lỗi 401; nếu tài khoản đã không còn trong dữ liệu trả lỗi 404.
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();

        if (principal instanceof AuthenticatedUser authenticatedUser) {
            return userRepository.findById(authenticatedUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        throw new UnauthorizedException("Authentication is required");
    }
}
