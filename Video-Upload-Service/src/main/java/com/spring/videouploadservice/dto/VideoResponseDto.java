package com.spring.videouploadservice.dto;

import com.spring.videouploadservice.entity.VideoMetadata;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class VideoResponseDto {
    private final String id;
    private final String title;
    private final String description;
    private final String videoUrl;
    private final String thumbnailUrl;
    private final String channelName;
    private final long views;
    private final LocalDateTime createdAt;

    public static VideoResponseDto from(VideoMetadata metadata, String videoUrl, String thumbnailUrl) {
        return VideoResponseDto.builder()
                .id(metadata.getId().toString())
                .title(metadata.getTitle())
                .description(metadata.getDescription())
                .videoUrl(videoUrl)
                .thumbnailUrl(thumbnailUrl)
                .channelName(metadata.getChannelName())
                .views(metadata.getViews() == null ? 0L : metadata.getViews())
                .createdAt(metadata.getCreatedAt())
                .build();
    }
}
