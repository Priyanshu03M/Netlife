package com.spring.videouploadservice.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UploadResponseDto {
    private String status;
    private String bucket;
    private String objectKey;
    private String title;
    private String description;
    private String contentType;
    private long size;
    private String userId;
}
