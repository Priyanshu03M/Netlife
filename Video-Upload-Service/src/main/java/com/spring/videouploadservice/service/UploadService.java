package com.spring.videouploadservice.service;

import com.spring.videouploadservice.dto.CompleteVideoRequestDto;
import com.spring.videouploadservice.dto.UploadBackendRequest;
import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.entity.VideoMetadata;
import com.spring.videouploadservice.exception.BadRequestException;
import com.spring.videouploadservice.exception.StorageException;
import com.spring.videouploadservice.repository.VideoMetadataRepository;
import io.minio.StatObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;

import java.util.Objects;
import java.util.concurrent.TimeUnit;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class UploadService {

    private final VideoMetadataRepository videoMetadataRepository;
    private final MinioClient minioClient;
    private final KafkaTemplate<String, CompleteVideoRequestDto> kafkaTemplate;
    @Value("${minio.bucket}")
    private String bucketName;
    @Value("${app.kafka.topic.video-uploaded:video-processing-topic}")
    private String videoUploadedTopic;
    private static final String UPLOADING = "UPLOADING";
    private static final String UPLOADED = "UPLOADED";
    private static final String FAILED = "FAILED";
    private static final int PRESIGNED_URL_EXPIRY_DAYS = 1;

    public UploadResponseDto uploadVideoMetadata(UploadBackendRequest uploadVideoRequestDto) {
        UploadResponseDto uploadResponseDto = UploadResponseDto.builder().status(UPLOADING).build();
        validateUpload(uploadVideoRequestDto);
        String videoId = UUID.randomUUID().toString();
        String objectKey = buildObjectKey(videoId);
        LocalDateTime uploadedAt = LocalDateTime.now();
        String userId = uploadVideoRequestDto.getUserId();
        log.debug("Preparing upload: userId={}, objectKey={}", userId, objectKey);
        String videoUrl = generatePresignedUrl(objectKey);

        try {
            VideoMetadata videoMetadata = VideoMetadata.builder()
                    .id(videoId)
                    .userId(userId)
                    .title(uploadVideoRequestDto.getTitle())
                    .description(uploadVideoRequestDto.getDescription())
                    .processedPath(null)
                    .objectKey(objectKey)
                    .views(0L)
                    .duration(null)
                    .size(null)
                    .status(UPLOADING)
                    .createdAt(uploadedAt)
                    .updatedAt(uploadedAt)
                    .build();

            videoMetadataRepository.saveAndFlush(videoMetadata);
            log.info("Video metadata persisted: videoId={}, objectKey={}, userId={}",
                    videoMetadata.getId(),
                    videoMetadata.getObjectKey(),
                    videoMetadata.getUserId());

            uploadResponseDto.setUrl(videoUrl);
            uploadResponseDto.setVideoId(videoId);

        } catch (RuntimeException e) {
            log.warn("Metadata persistence failed", e);
            throw new StorageException("Failed to persist video metadata", e);
        }
        return uploadResponseDto;
    }

    public String completeUpload(CompleteVideoRequestDto completeVideoRequestDto) {

        VideoMetadata video = videoMetadataRepository.findById(completeVideoRequestDto.getVideoId())
                .orElseThrow(() -> new RuntimeException("Video not found"));
        if (Objects.equals(video.getStatus(), UPLOADED)) {
            return UPLOADED;
        }
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(video.getObjectKey())
                            .build()
            );

            video.setStatus(UPLOADED);
            video.setUpdatedAt(LocalDateTime.now());
            videoMetadataRepository.save(video);

            publishToTopic(completeVideoRequestDto);

        } catch (Exception e) {
            video.setStatus(FAILED);
            video.setUpdatedAt(LocalDateTime.now());
            video.setErrorMessage(e.getMessage());
            videoMetadataRepository.save(video);

            throw new StorageException("Upload verification failed",e);
        }

        return UPLOADED;
    }

    private void publishToTopic(CompleteVideoRequestDto completeVideoRequestDto) {
        kafkaTemplate.send(videoUploadedTopic, completeVideoRequestDto.getVideoId(), completeVideoRequestDto)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish video uploaded event: videoId={}", completeVideoRequestDto.getVideoId(), ex);
                    } else {
                        log.info("Published video uploaded event: videoId={}, topic={}",
                                completeVideoRequestDto.getVideoId(), videoUploadedTopic);
                    }
                });
    }

    private void validateUpload(UploadBackendRequest uploadVideoRequestDto) {
        if (uploadVideoRequestDto == null) {
            throw new BadRequestException("Upload request is required");
        }
        if (uploadVideoRequestDto.getUserId() == null) {
            throw new BadRequestException("User id is required");
        }
        if (uploadVideoRequestDto.getTitle() == null) {
            throw new BadRequestException("Title is required");
        }
        if (uploadVideoRequestDto.getUserId().length() > 50) {
            throw new BadRequestException("User id must not exceed 50 characters");
        }
    }
    private String buildObjectKey(String userId) {
        String safeUserID = (userId == null || userId.isBlank()) ? "anonymous" : userId.trim();
        return "raw/" + safeUserID + "/original.mp4";
    }
    private String generatePresignedUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }

        try {
            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(PRESIGNED_URL_EXPIRY_DAYS, TimeUnit.DAYS)
                            .build()
            );
            log.debug("Generated presigned URL: bucket={}, objectKey={}, expiresInDays={}", bucketName, objectKey, PRESIGNED_URL_EXPIRY_DAYS);
            return url;
        } catch (Exception exception) {
            throw new StorageException("Failed to generate presigned URL", exception);
        }
    }
}
