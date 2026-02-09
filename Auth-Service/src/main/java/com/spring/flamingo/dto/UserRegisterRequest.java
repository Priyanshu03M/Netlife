package com.spring.flamingo.dto;

import lombok.Getter;

@Getter
public class UserRegisterRequest {
    private String username;
    private String password;
    private final String role = "ROLE_USER";
}
