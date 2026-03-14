package com.spring.videouploadservice.service;

import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.dto.UploadVideoDto;
import com.spring.videouploadservice.entity.VideoMetadata;
import com.spring.videouploadservice.repository.VideoMetadataRepository;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.errors.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadService {
    private final MinioClient minioClient;
    private final VideoMetadataRepository videoMetadataRepository;

    @Value("${minio.bucket}")
    private String bucketName;

    public UploadResponseDto upload(UploadVideoDto uploadVideoDto) throws Exception {
        if(uploadVideoDto.getFile() == null || uploadVideoDto.getFile().isEmpty()) {
            throw new IllegalArgumentException("Upload File is Empty");
        }

        if(uploadVideoDto.getContentType() == null || !uploadVideoDto.getContentType().startsWith("video/")) {
            throw new IllegalArgumentException("Upload File Type Not Supported");
        }

        String objectKey = buildObjectKey(uploadVideoDto.getUserId(), uploadVideoDto.getOriginalFilename());

        try {
            ensureBucketExists(bucketName);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(uploadVideoDto.getFile().getInputStream(), uploadVideoDto.getFile().getSize(), -1)
                            .contentType(uploadVideoDto.getContentType())
                            .build()
            );
        } catch (MinioException e) {
            throw new MinioException(e.getMessage());
        }

        VideoMetadata videoMetadata = VideoMetadata.builder()
                .id(UUID.randomUUID().toString())
                .userId(uploadVideoDto.getUserId())
                .title(uploadVideoDto.getTitle())
                .description(uploadVideoDto.getDescription())
                .bucketUrl(bucketName)
                .objectKey(objectKey)
                .duration(null)
                .size(uploadVideoDto.getFile().getSize())
                .format(uploadVideoDto.getContentType())
                .status("UPLOADED")
                .createdAt(LocalDateTime.now())
                .build();

        videoMetadataRepository.save(videoMetadata);

        return UploadResponseDto.builder()
                .status("UPLOADED")
                .bucket(bucketName)
                .objectKey(objectKey)
                .title(uploadVideoDto.getTitle())
                .description(uploadVideoDto.getDescription())
                .contentType(uploadVideoDto.getContentType())
                .size(uploadVideoDto.getFile().getSize())
                .userId(uploadVideoDto.getUserId())
                .build();
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
}
