package com.spring.videouploadservice.dto;

import lombok.*;
import org.apache.kafka.common.protocol.types.Field;

@Builder
@Getter
@Setter
@AllArgsConstructor
@RequiredArgsConstructor
public class UploadBackendRequest {
    private String title;
    private String description;
    private String userId;
    private String username;
}
