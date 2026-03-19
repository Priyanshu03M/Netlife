package com.spring.videouploadservice.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class VideoPageResponseDto {
    private final List<VideoSummaryDto> videos;
    private final String nextCursor;
    private final int limit;
    private final boolean hasMore;
}
