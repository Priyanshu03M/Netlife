package com.spring.videouploadservice.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@RequiredArgsConstructor
class CursorPosition {
    private final LocalDateTime createdAt;
    private final UUID id;
}
