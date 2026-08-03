package com.tropilot.security;

import com.tropilot.enums.UserRole;
import com.tropilot.service.ResidentRoomAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
/**
 * Interceptor kiểm tra chủ hộ còn quyền truy cập vào phòng đang được phân cho họ hay không.
 * Nó chạy trước controller đối với request của RESIDENT_HEAD để chặn trường hợp phân phòng đã kết thúc.
 */
public class ResidentRoomAccessInterceptor implements HandlerInterceptor {

    private final ResidentRoomAccessService residentRoomAccessService;

    /**
     * Bỏ qua request OPTIONS cho CORS; với chủ hộ đã xác thực thì yêu cầu phải có phân phòng ACTIVE.
     */
    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            return true;
        }

        if (user.getRole() == UserRole.RESIDENT_HEAD) {
            residentRoomAccessService.requireActiveAssignment(user.getId());
        }

        return true;
    }
}
