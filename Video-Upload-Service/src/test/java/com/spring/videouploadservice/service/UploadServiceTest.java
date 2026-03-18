package com.spring.videouploadservice.service;

import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.dto.UploadVideoDto;
import com.spring.videouploadservice.entity.VideoMetadata;
import com.spring.videouploadservice.repository.VideoMetadataRepository;
import io.minio.MinioClient;
import io.minio.RemoveObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UploadServiceTest {

    @Mock
    private MinioClient minioClient;

    @Mock
    private VideoMetadataRepository videoMetadataRepository;

    private UploadService uploadService;

    @BeforeEach
    void setUp() {
        uploadService = new UploadService(minioClient, videoMetadataRepository);
        ReflectionTestUtils.setField(uploadService, "bucketName", "videos");
    }

    @Test
    void uploadRejectsMissingUserIdBeforeStorageWrite() throws Exception {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "Demo", "Description", "   ");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> uploadService.upload(uploadVideoDto));

        assertEquals("User Id is required", exception.getMessage());
        verify(minioClient, never()).putObject(any());
        verify(videoMetadataRepository, never()).saveAndFlush(any(VideoMetadata.class));
    }

    @Test
    void uploadRejectsMissingTitleBeforeStorageWrite() throws Exception {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "   ", "Description", "user-1");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> uploadService.upload(uploadVideoDto));

        assertEquals("Title is required", exception.getMessage());
        verify(minioClient, never()).putObject(any());
        verify(videoMetadataRepository, never()).saveAndFlush(any(VideoMetadata.class));
    }

    @Test
    void uploadRemovesObjectWhenMetadataPersistenceFails() throws Exception {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "Demo", "Description", "user-1");
        when(minioClient.bucketExists(any())).thenReturn(true);
        when(videoMetadataRepository.saveAndFlush(any(VideoMetadata.class)))
                .thenThrow(new IllegalStateException("db failure"));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> uploadService.upload(uploadVideoDto));

        assertEquals("db failure", exception.getMessage());
        verify(minioClient).removeObject(any(RemoveObjectArgs.class));
    }

    @Test
    void uploadPersistsMetadataAndBuildsResponse() throws Exception {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(videoFile(), "Demo", "Description", "user-1");
        when(minioClient.bucketExists(any())).thenReturn(true);

        UploadResponseDto response = uploadService.upload(uploadVideoDto);

        assertEquals("UPLOADED", response.getStatus());
        assertEquals("videos", response.getBucket());
        assertEquals("Demo", response.getTitle());
        assertEquals("user-1", response.getUserId());
        assertNotNull(response.getObjectKey());
        verify(videoMetadataRepository).saveAndFlush(any(VideoMetadata.class));
    }

    private MockMultipartFile videoFile() {
        return new MockMultipartFile("file", "demo.mp4", "video/mp4", new byte[]{1, 2, 3});
    }
}
