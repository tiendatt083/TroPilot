package com.tropilot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
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
@Embeddable
public class ContactPhone {

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "phone_number", nullable = false, length = 30)
    private String phoneNumber;
}
