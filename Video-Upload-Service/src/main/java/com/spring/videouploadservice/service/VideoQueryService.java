package com.spring.videouploadservice.service;

import com.spring.videouploadservice.dto.CursorPageResponse;
import com.spring.videouploadservice.dto.VideoResponseDto;
import com.spring.videouploadservice.entity.VideoMetadata;
import com.spring.videouploadservice.exception.BadRequestException;
import com.spring.videouploadservice.repository.VideoMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class VideoQueryService {
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;
    private static final String UPLOADED_STATUS = "UPLOADED";

    private final VideoMetadataRepository videoMetadataRepository;
    private final StorageService storageService;

    public CursorPageResponse<VideoResponseDto> listVideos(String cursor, String query, Integer limit) {
        CursorPosition cursorPosition = decodeCursor(cursor);
        int pageSize = resolvePageSize(limit);
        String normalizedQuery = normalizeQuery(query);

        log.debug("Listing videos: cursorCreatedAt={}, cursorId={}, query='{}', limit={}",
                cursorPosition != null ? cursorPosition.getCreatedAt() : null,
                cursorPosition != null ? cursorPosition.getId() : null,
                normalizedQuery,
                pageSize);

        List<VideoMetadata> videos = videoMetadataRepository.findPageByStatusAndCursor(
                UPLOADED_STATUS,
                normalizedQuery,
                cursorPosition == null ? null : cursorPosition.getCreatedAt(),
                cursorPosition == null ? null : cursorPosition.getId(),
                PageRequest.of(0, pageSize + 1)
        );

        boolean hasMore = videos.size() > pageSize;
        List<VideoMetadata> currentPage = hasMore ? videos.subList(0, pageSize) : videos;
        String nextCursor = hasMore ? encodeCursor(currentPage.get(currentPage.size() - 1)) : null;

        List<VideoResponseDto> items = currentPage.stream()
                .map(this::toVideoResponse)
                .toList();

        log.info("Listed videos: fetched={}, returned={}, hasMore={}, nextCursorPresent={}",
                videos.size(),
                items.size(),
                hasMore,
                nextCursor != null);

        return CursorPageResponse.<VideoResponseDto>builder()
                .items(items)
                .nextCursor(nextCursor)
                .limit(pageSize)
                .hasMore(hasMore)
                .build();
    }

    private int resolvePageSize(Integer limit) {
        if (limit == null) {
            return DEFAULT_PAGE_SIZE;
        }

        if (limit < 1 || limit > MAX_PAGE_SIZE) {
            throw new BadRequestException("Limit must be between 1 and " + MAX_PAGE_SIZE);
        }

        return limit;
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String trimmed = query.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private VideoResponseDto toVideoResponse(VideoMetadata metadata) {
        return VideoResponseDto.from(
                metadata,
                storageService.generatePresignedUrl(metadata.getObjectKey()),
                storageService.generatePresignedUrl(metadata.getThumbnailObjectKey())
        );
    }

    private String encodeCursor(VideoMetadata metadata) {
        String payload = metadata.getCreatedAt() + "|" + metadata.getId();
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    private CursorPosition decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }

        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor.trim()), StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|", 2);
            if (parts.length != 2 || parts[1].isBlank()) {
                throw new BadRequestException("Invalid cursor");
            }

            CursorPosition cursorPosition = new CursorPosition(
                    LocalDateTime.parse(parts[0]),
                    UUID.fromString(parts[1])
            );
            log.debug("Decoded cursor successfully: createdAt={}, id={}",
                    cursorPosition.getCreatedAt(),
                    cursorPosition.getId());
            return cursorPosition;
        } catch (IllegalArgumentException | DateTimeParseException exception) {
            log.warn("Failed to decode cursor: cursor={}", cursor, exception);
            throw new BadRequestException("Invalid cursor");
        }
    }

}
