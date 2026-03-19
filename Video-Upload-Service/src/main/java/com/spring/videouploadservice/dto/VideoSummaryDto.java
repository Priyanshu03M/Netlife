package com.spring.videouploadservice.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class VideoSummaryDto {
    private final String objectKey;
    private final String bucket;
    private final long size;
    private final OffsetDateTime lastModified;
    private final String url;
}
