package com.tropilot.security;

import com.tropilot.exception.UnauthorizedException;

public final class AuthenticatedUsers {

    private AuthenticatedUsers() {
    }

    public static Long requireUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }
        return user.getId();
    }
}
