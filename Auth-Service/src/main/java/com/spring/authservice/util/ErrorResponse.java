package com.spring.authservice.util;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String errorMessage;
    private String path;

    @Override
    public String toString() {
        return "{" +
                "\"timestamp\":\"" + timestamp + "\"," +
                "\"status\":" + status + "," +
                "\"error\":\"" + error + "\"," +
                "\"message\":\"" + errorMessage + "\"," +
                "\"path\":\"" + path + "\"," +
                "}";
    }

}
