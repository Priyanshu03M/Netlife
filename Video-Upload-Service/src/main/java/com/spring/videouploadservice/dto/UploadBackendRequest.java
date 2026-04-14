package com.spring.videouploadservice.dto;

import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@RequiredArgsConstructor
public class UploadBackendRequest {
    private String title;
    private String description;
    private String userId;
}
