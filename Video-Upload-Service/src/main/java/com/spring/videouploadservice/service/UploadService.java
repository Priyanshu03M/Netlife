package com.spring.videouploadservice.service;

import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.dto.UploadVideoDto;
import com.spring.videouploadservice.entity.VideoMetadata;
import com.spring.videouploadservice.exception.BadRequestException;
import com.spring.videouploadservice.exception.StorageException;
import com.spring.videouploadservice.repository.VideoMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class UploadService {
    private static final String UPLOADED_STATUS = "UPLOADED";

    private final StorageService storageService;
    private final VideoMetadataRepository videoMetadataRepository;

    public UploadResponseDto upload(UploadVideoDto uploadVideoDto, String channelName) {
        validateUpload(uploadVideoDto);

        String userId = uploadVideoDto.getUserId();
        String objectKey = buildObjectKey(uploadVideoDto.getUserId(), uploadVideoDto.getOriginalFilename());
        LocalDateTime uploadedAt = LocalDateTime.now();
        String resolvedChannelName = resolveChannelName(channelName, uploadVideoDto.getUserId());

        log.debug("Preparing upload: userId={}, objectKey={}, contentType={}, size={}, channelName='{}'",
                userId,
                objectKey,
                uploadVideoDto.getContentType(),
                uploadVideoDto.getSize(),
                resolvedChannelName);

        uploadToStorage(uploadVideoDto, objectKey);

        try {
            VideoMetadata videoMetadata = VideoMetadata.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(userId)
                    .title(uploadVideoDto.getTitle())
                    .description(uploadVideoDto.getDescription())
                    .bucketUrl(storageService.getBucketName())
                    .objectKey(objectKey)
                    .thumbnailObjectKey(null)
                    .channelName(resolvedChannelName)
                    .views(0L)
                    .duration(null)
                    .size(uploadVideoDto.getSize())
                    .format(uploadVideoDto.getContentType())
                    .status(UPLOADED_STATUS)
                    .createdAt(uploadedAt)
                    .build();

            videoMetadataRepository.saveAndFlush(videoMetadata);
            log.info("Video metadata persisted: videoId={}, objectKey={}, userId={}",
                    videoMetadata.getId(),
                    videoMetadata.getObjectKey(),
                    videoMetadata.getUserId());
        } catch (RuntimeException e) {
            log.warn("Metadata persistence failed. Rolling back storage object: objectKey={}", objectKey, e);
            storageService.deleteObject(objectKey);
            throw e;
        }

        return UploadResponseDto.from(storageService.getBucketName(), objectKey, uploadVideoDto, UPLOADED_STATUS, uploadedAt);
    }

    private void validateUpload(UploadVideoDto uploadVideoDto) {
        if (uploadVideoDto == null) {
            throw new BadRequestException("Upload request is required");
        }

        if (!uploadVideoDto.hasFile()) {
            throw new BadRequestException("Upload file is empty");
        }

        if (!uploadVideoDto.isVideoFile()) {
            throw new BadRequestException("Upload file type not supported");
        }

        if (uploadVideoDto.getUserId() == null) {
            throw new BadRequestException("User id is required");
        }

        if (uploadVideoDto.getTitle() == null) {
            throw new BadRequestException("Title is required");
        }

        if (uploadVideoDto.getUserId().length() > 50) {
            throw new BadRequestException("User id must not exceed 50 characters");
        }
    }

    private void uploadToStorage(UploadVideoDto uploadVideoDto, String objectKey) {
        try (InputStream inputStream = uploadVideoDto.getFile().getInputStream()) {
            log.debug("Uploading video to storage: objectKey={}", objectKey);
            storageService.uploadVideo(
                    objectKey,
                    inputStream,
                    uploadVideoDto.getSize(),
                    uploadVideoDto.getContentType()
            );
            log.info("Video uploaded to storage: objectKey={}", objectKey);
        } catch (IOException exception) {
            throw new StorageException("Failed to read upload file", exception);
        }
    }

    private String buildObjectKey(String userId, String originalFilename) {
        String safeUserID = (userId == null || userId.isBlank()) ? "anonymous" : userId.trim();
        String safeName = (originalFilename == null || originalFilename.isBlank())
                ? "upload.bin"
                : originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_").toLowerCase(Locale.ROOT);
        return safeUserID + "/" + UUID.randomUUID() + "/" + safeName;
    }

    private String resolveChannelName(String channelName, String userId) {
        if (channelName == null || channelName.isBlank()) {
            return userId;
        }
        return channelName.trim();
    }
}
