package com.spring.videouploadservice.service;

import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.dto.UploadVideoDto;
import com.spring.videouploadservice.entity.VideoMetadata;
import com.spring.videouploadservice.exception.BadRequestException;
import com.spring.videouploadservice.repository.VideoMetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UploadServiceTest {

    @Mock
    private StorageService storageService;

    @Mock
    private VideoMetadataRepository videoMetadataRepository;

    private UploadService uploadService;

    @BeforeEach
    void setUp() {
        uploadService = new UploadService(storageService, videoMetadataRepository);
    }

    @Test
    void uploadRejectsMissingUserIdBeforeStorageWrite() {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "Demo", "Description", "   ");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> uploadService.upload(uploadVideoDto, null));

        assertEquals("User id is required", exception.getMessage());
        verify(storageService, never()).uploadVideo(any(), any(), any(Long.class), any());
        verify(videoMetadataRepository, never()).saveAndFlush(any(VideoMetadata.class));
    }

    @Test
    void uploadRejectsMissingTitleBeforeStorageWrite() {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "   ", "Description", validUserId());

        BadRequestException exception = assertThrows(BadRequestException.class, () -> uploadService.upload(uploadVideoDto, null));

        assertEquals("Title is required", exception.getMessage());
        verify(storageService, never()).uploadVideo(any(), any(), any(Long.class), any());
        verify(videoMetadataRepository, never()).saveAndFlush(any(VideoMetadata.class));
    }

    @Test
    void uploadRejectsUserIdLongerThanColumnLimitBeforeStorageWrite() {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "Demo", "Description", "123456789012345678901234567890123456789012345678901");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> uploadService.upload(uploadVideoDto, null));

        assertEquals("User id must not exceed 50 characters", exception.getMessage());
        verify(storageService, never()).uploadVideo(any(), any(), any(Long.class), any());
        verify(videoMetadataRepository, never()).saveAndFlush(any(VideoMetadata.class));
    }

    @Test
    void uploadRemovesObjectWhenMetadataPersistenceFails() throws Exception {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "Demo", "Description", validUserId());
        when(storageService.getBucketName()).thenReturn("videos");
        doNothing().when(storageService).uploadVideo(any(), any(), any(Long.class), any());
        when(videoMetadataRepository.saveAndFlush(any(VideoMetadata.class)))
                .thenThrow(new IllegalStateException("db failure"));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> uploadService.upload(uploadVideoDto, "Netlife"));

        assertEquals("db failure", exception.getMessage());
        verify(storageService).deleteObject(any());
    }

    @Test
    void uploadPersistsMetadataAndBuildsResponse() throws Exception {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "Demo", "Description", validUserId());
        when(storageService.getBucketName()).thenReturn("videos");
        doNothing().when(storageService).uploadVideo(any(), any(), any(Long.class), any());

        UploadResponseDto response = uploadService.upload(uploadVideoDto, "Netlife");

        assertEquals("UPLOADED", response.getStatus());
        assertEquals("videos", response.getBucket());
        assertEquals("Demo", response.getTitle());
        assertEquals(validUserId(), response.getUserId());
        assertNotNull(response.getObjectKey());
        verify(videoMetadataRepository).saveAndFlush(any(VideoMetadata.class));
    }

    private MockMultipartFile videoFile() {
        return new MockMultipartFile("file", "demo.mp4", "video/mp4", new byte[]{1, 2, 3});
    }

    private String validUserId() {
        return "user-1";
    }
}
