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
public class ResidentRoomAccessInterceptor implements HandlerInterceptor {

    private final ResidentRoomAccessService residentRoomAccessService;

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
