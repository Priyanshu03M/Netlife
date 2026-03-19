package com.spring.videouploadservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@AllArgsConstructor
@Builder
@Entity
@Getter
@NoArgsConstructor
@Table(name = "videos")
public class VideoMetadata {
    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "bucket_url", nullable = false)
    private String bucketUrl;

    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(name = "thumbnail_object_key")
    private String thumbnailObjectKey;

    @Column(name = "channel_name", nullable = false, columnDefinition = "VARCHAR(255)")
    private String channelName;

    @Column(nullable = false)
    private Long views;

    private Long size;
    private Integer duration;

    @Column(nullable = false)
    private String format;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
