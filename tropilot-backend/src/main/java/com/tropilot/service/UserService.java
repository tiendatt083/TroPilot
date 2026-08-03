package com.tropilot.service;

import com.tropilot.dto.request.AdminCreateUserRequest;
import com.tropilot.dto.response.UserResponse;

import java.util.List;

/** Hợp đồng quản trị tài khoản: tạo, xem danh sách và xóa người dùng. */
public interface UserService {

    UserResponse createUser(AdminCreateUserRequest request);

    List<UserResponse> getUsers();

    void deleteUser(Long id);
}
