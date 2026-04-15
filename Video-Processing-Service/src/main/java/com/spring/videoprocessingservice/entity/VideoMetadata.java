package com.spring.videoprocessingservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@Builder
@Entity
@Data
@NoArgsConstructor
@Table(name = "videos")
public class VideoMetadata {
    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "processed_path")
    private String processedPath;

    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(nullable = false)
    private Long views;
    private Long size;
    private Integer duration;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "err_message")
    private String errorMessage;

    @Column(name = "Thumbnail_path")
    private String thumbnailPath;

    @Column(name = "channel_name")
    private String channelName;
}
