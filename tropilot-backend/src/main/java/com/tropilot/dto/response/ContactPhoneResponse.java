package com.tropilot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
/** Một số liên hệ đã cấu hình, gồm tên hiển thị và số điện thoại. */
public class ContactPhoneResponse {

    private String displayName;
    private String phoneNumber;
}
