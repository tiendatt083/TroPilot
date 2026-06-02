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
public class CurrentUserProvider {

    private final UserRepository userRepository;

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
