package com.spring.videodeliveryservice.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class VideoMetadataResponse {
    private String id;
    private String title;
    private String description;
    private Long views;
    private Long size;
    private Integer duration;
    private String thumbnailUrl;
    private String channelName;
}
