package com.spring.videouploadservice.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UploadResponseDto {
    private final String status;
    private final String bucket;
    private final String objectKey;
    private final String title;
    private final String description;
    private final String contentType;
    private final long size;
    private final String userId;
    private final String originalFilename;
    private final LocalDateTime uploadedAt;

    public static UploadResponseDto from(String bucketName, String objectKey, UploadVideoDto uploadVideoDto, String status, LocalDateTime uploadedAt) {
        return UploadResponseDto.builder()
                .status(status)
                .bucket(bucketName)
                .objectKey(objectKey)
                .title(uploadVideoDto.getTitle())
                .description(uploadVideoDto.getDescription())
                .contentType(uploadVideoDto.getContentType())
                .size(uploadVideoDto.getSize())
                .userId(uploadVideoDto.getUserId())
                .originalFilename(uploadVideoDto.getOriginalFilename())
                .uploadedAt(uploadedAt).build();
    }
}
