package com.spring.videouploadservice.service;

import com.spring.videouploadservice.dto.CursorPageResponse;
import com.spring.videouploadservice.dto.VideoResponseDto;
import com.spring.videouploadservice.entity.VideoMetadata;
import com.spring.videouploadservice.exception.BadRequestException;
import com.spring.videouploadservice.repository.VideoMetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VideoQueryServiceTest {

    @Mock
    private VideoMetadataRepository videoMetadataRepository;

    @Mock
    private StorageService storageService;

    private VideoQueryService videoQueryService;

    @BeforeEach
    void setUp() {
        videoQueryService = new VideoQueryService(videoMetadataRepository, storageService);
    }

    @Test
    void listVideosReturnsBusinessDtoFromDatabaseRecords() {
        VideoMetadata first = video("11111111-1111-1111-1111-111111111111", LocalDateTime.of(2026, 3, 20, 10, 0));
        VideoMetadata second = video("22222222-2222-2222-2222-222222222222", LocalDateTime.of(2026, 3, 20, 9, 0));
        when(videoMetadataRepository.findPageByStatusAndCursor(anyString(), any(), any(), any()))
                .thenReturn(List.of(first, second));
        when(storageService.generatePresignedUrl("video-1")).thenReturn("https://cdn/video-1");
        when(storageService.generatePresignedUrl("thumb-1")).thenReturn("https://cdn/thumb-1");
        when(storageService.generatePresignedUrl("video-2")).thenReturn("https://cdn/video-2");
        when(storageService.generatePresignedUrl("thumb-2")).thenReturn("https://cdn/thumb-2");

        CursorPageResponse<VideoResponseDto> response = videoQueryService.listVideos(null, null, null);

        assertEquals(2, response.getItems().size());
        assertNull(response.getNextCursor());
        assertEquals("Demo 11111111-1111-1111-1111-111111111111", response.getItems().get(0).getTitle());
        assertEquals("Netlife", response.getItems().get(0).getChannelName());
        assertEquals("https://cdn/video-1", response.getItems().get(0).getVideoUrl());
        assertEquals("https://cdn/thumb-1", response.getItems().get(0).getThumbnailUrl());
    }

    @Test
    void listVideosRejectsInvalidCursor() {
        BadRequestException exception = assertThrows(BadRequestException.class, () -> videoQueryService.listVideos("%%%", null, null));

        assertEquals("Invalid cursor", exception.getMessage());
    }

    @Test
    void listVideosReturnsNextCursorWhenMoreRecordsExist() {
        List<VideoMetadata> records = List.of(
                video("11111111-1111-1111-1111-111111111111", LocalDateTime.of(2026, 3, 20, 10, 0)),
                video("22222222-2222-2222-2222-222222222222", LocalDateTime.of(2026, 3, 20, 9, 59)),
                video("33333333-3333-3333-3333-333333333333", LocalDateTime.of(2026, 3, 20, 9, 58)),
                video("44444444-4444-4444-4444-444444444444", LocalDateTime.of(2026, 3, 20, 9, 57)),
                video("55555555-5555-5555-5555-555555555555", LocalDateTime.of(2026, 3, 20, 9, 56)),
                video("66666666-6666-6666-6666-666666666666", LocalDateTime.of(2026, 3, 20, 9, 55)),
                video("77777777-7777-7777-7777-777777777777", LocalDateTime.of(2026, 3, 20, 9, 54)),
                video("88888888-8888-8888-8888-888888888888", LocalDateTime.of(2026, 3, 20, 9, 53)),
                video("99999999-9999-9999-9999-999999999999", LocalDateTime.of(2026, 3, 20, 9, 52)),
                video("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", LocalDateTime.of(2026, 3, 20, 9, 51)),
                video("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", LocalDateTime.of(2026, 3, 20, 9, 50))
        );
        when(videoMetadataRepository.findPageByStatusAndCursor(anyString(), any(), any(), any()))
                .thenReturn(records);
        when(storageService.generatePresignedUrl(any())).thenAnswer(invocation -> "https://cdn/" + invocation.getArgument(0));

        CursorPageResponse<VideoResponseDto> response = videoQueryService.listVideos(null, null, null);

        assertEquals(10, response.getItems().size());
        assertNotNull(response.getNextCursor());
        verify(videoMetadataRepository).findPageByStatusAndCursor(anyString(), any(), any(), any());
    }

    @Test
    void listVideosRejectsInvalidLimit() {
        BadRequestException exception = assertThrows(BadRequestException.class, () -> videoQueryService.listVideos(null, null, 0));

        assertEquals("Limit must be between 1 and 50", exception.getMessage());
    }

    private VideoMetadata video(String id, LocalDateTime createdAt) {
        String suffix = id.substring(0, 1);
        return VideoMetadata.builder()
                .id(id)
                .userId("user-1")
                .title("Demo " + id)
                .description("Description " + id)
                .bucketUrl("videos")
                .objectKey("video-" + suffix)
                .thumbnailObjectKey("thumb-" + suffix)
                .channelName("Netlife")
                .views(100L)
                .size(1000L)
                .duration(120)
                .format("video/mp4")
                .status("UPLOADED")
                .createdAt(createdAt)
                .build();
    }
}
