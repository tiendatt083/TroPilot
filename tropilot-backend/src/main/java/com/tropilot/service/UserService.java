package com.tropilot.service;

import com.tropilot.dto.request.AdminCreateUserRequest;
import com.tropilot.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse createUser(AdminCreateUserRequest request);

    List<UserResponse> getUsers();

    void deleteUser(Long id);
}
