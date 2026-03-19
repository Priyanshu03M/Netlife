package com.spring.videouploadservice.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
class CursorPosition {
    private final LocalDateTime createdAt;
    private final String id;
}
