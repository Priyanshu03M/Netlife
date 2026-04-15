package com.spring.userservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserInfo {
    private String id;
    private String username;
    private String email;
}
