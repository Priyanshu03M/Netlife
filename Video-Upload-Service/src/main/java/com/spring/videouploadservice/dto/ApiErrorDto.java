package com.spring.videouploadservice.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiErrorDto {
    private final String code;
    private final String message;
}
