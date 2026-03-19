package com.spring.videouploadservice.service;

import com.spring.videouploadservice.dto.VideoPageResponseDto;
import com.spring.videouploadservice.dto.VideoSummaryDto;
import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.dto.UploadVideoDto;
import com.spring.videouploadservice.entity.VideoMetadata;
import com.spring.videouploadservice.repository.VideoMetadataRepository;
import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.ListObjectsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.Result;
import io.minio.errors.*;
import io.minio.http.Method;
import io.minio.messages.Item;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadService {
    private static final int VIDEO_PAGE_SIZE = 10;
    private final MinioClient minioClient;
    private final VideoMetadataRepository videoMetadataRepository;

    @Value("${minio.bucket}")
    private String bucketName;

    public VideoPageResponseDto listVideos(String cursor) throws Exception {
        ensureBucketExists(bucketName);

        List<VideoSummaryDto> videos = new ArrayList<>();
        String normalizedCursor = normalizeCursor(cursor);

        ListObjectsArgs.Builder listArgsBuilder = ListObjectsArgs.builder()
                .bucket(bucketName)
                .recursive(true)
                .maxKeys(VIDEO_PAGE_SIZE + 1);

        if (normalizedCursor != null) {
            listArgsBuilder.startAfter(normalizedCursor);
        }

        Iterable<Result<Item>> results = minioClient.listObjects(listArgsBuilder.build());

        boolean hasMore = false;
        for (Result<Item> result : results) {
            Item item = result.get();
            if (item.isDir()) {
                continue;
            }

            if (videos.size() == VIDEO_PAGE_SIZE) {
                hasMore = true;
                break;
            }

            videos.add(VideoSummaryDto.builder()
                    .bucket(bucketName)
                    .objectKey(item.objectName())
                    .size(item.size())
                    .lastModified(item.lastModified().toOffsetDateTime())
                    .url(buildObjectUrl(item.objectName()))
                    .build());
        }

        String nextCursor = hasMore ? videos.get(videos.size() - 1).getObjectKey() : null;

        return VideoPageResponseDto.builder()
                .videos(videos)
                .nextCursor(nextCursor)
                .limit(VIDEO_PAGE_SIZE)
                .hasMore(hasMore)
                .build();
    }

    public UploadResponseDto upload(UploadVideoDto uploadVideoDto) throws Exception {
        validateUpload(uploadVideoDto);

        String objectKey = buildObjectKey(uploadVideoDto.getUserId(), uploadVideoDto.getOriginalFilename());
        LocalDateTime uploadedAt = LocalDateTime.now();

        uploadToStorage(uploadVideoDto, objectKey);

        try {
            VideoMetadata videoMetadata = VideoMetadata.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(uploadVideoDto.getUserId())
                    .title(uploadVideoDto.getTitle())
                    .description(uploadVideoDto.getDescription())
                    .bucketUrl(bucketName)
                    .objectKey(objectKey)
                    .duration(null)
                    .size(uploadVideoDto.getSize())
                    .format(uploadVideoDto.getContentType())
                    .status("UPLOADED")
                    .createdAt(uploadedAt)
                    .build();

            videoMetadataRepository.saveAndFlush(videoMetadata);
        } catch (RuntimeException e) {
            cleanupUploadedObject(objectKey);
            throw e;
        }

        return UploadResponseDto.from(bucketName, objectKey, uploadVideoDto, "UPLOADED", uploadedAt);
    }

    private void validateUpload(UploadVideoDto uploadVideoDto) {
        if (uploadVideoDto == null) {
            throw new IllegalArgumentException("Upload request is required");
        }

        if(!uploadVideoDto.hasFile()) {
            throw new IllegalArgumentException("Upload File is Empty");
        }

        if(!uploadVideoDto.isVideoFile()) {
            throw new IllegalArgumentException("Upload File Type Not Supported");
        }

        if (uploadVideoDto.getUserId() == null) {
            throw new IllegalArgumentException("User Id is required");
        }

        if (uploadVideoDto.getTitle() == null) {
            throw new IllegalArgumentException("Title is required");
        }
    }

    private void uploadToStorage(UploadVideoDto uploadVideoDto, String objectKey) throws Exception {
        try {
            ensureBucketExists(bucketName);
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectKey)
                    .stream(uploadVideoDto.getFile().getInputStream(), uploadVideoDto.getSize(), -1)
                    .contentType(uploadVideoDto.getContentType())
                    .build()
            );
        } catch (MinioException e) {
            throw new MinioException(e.getMessage());
        }
    }

    private void ensureBucketExists(String bucketName) throws Exception {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder()
                        .bucket(bucketName)
                        .build()
        );

        if(!exists) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
        }
    }

    private String buildObjectKey(String userId, String originalFilename) {
        String safeUserID = (userId == null || userId.isBlank()) ? "anonymous" : userId.trim();
        String safeName = (originalFilename == null || originalFilename.isBlank())
                ? "upload.bin"
                : originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        return safeUserID + "/" + UUID.randomUUID() + "/" + safeName;
    }

    private void cleanupUploadedObject(String objectKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );
        } catch (Exception cleanupException) {
            throw new IllegalStateException("Video uploaded but cleanup failed after metadata persistence error", cleanupException);
        }
    }

    private String buildObjectUrl(String objectKey) throws Exception {
        return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.GET)
                        .bucket(bucketName)
                        .object(objectKey)
                        .expiry(1, TimeUnit.DAYS)
                        .build()
        );
    }

    private String normalizeCursor(String cursor) {
        if (cursor == null) {
            return null;
        }

        String trimmed = cursor.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
