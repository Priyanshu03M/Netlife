package com.spring.authservice.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class JwtResponse {
    private String accessToken;
    private String refreshToken;

    @Override
    public String toString() {
        return "JwtResponse{" +
                "accessToken='" + accessToken + '\'' +
                ", refreshToken='" + refreshToken + '\'' +
                '}';
    }
}
