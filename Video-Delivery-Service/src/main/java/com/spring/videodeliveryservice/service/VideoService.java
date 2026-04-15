package com.spring.videodeliveryservice.service;

import com.spring.videodeliveryservice.dto.VideoMetadataResponse;
import com.spring.videodeliveryservice.dto.VideoViewEvent;
import com.spring.videodeliveryservice.entity.VideoMetadata;
import com.spring.videodeliveryservice.repository.VideoMetadataRepository;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.protocol.types.Field;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class VideoService {

    private static final int SIGNED_URL_EXPIRY_SECONDS = 60 * 30;
    private final MinioClient minioClient;
    private final VideoMetadataRepository videoMetadataRepository;
    private final KafkaTemplate<String, VideoViewEvent> kafkaTemplate;

    @Value("${minio.bucket}")
    private String bucketName;
    @Value("${app.kafka.topic.video-view:video-view-topic}")
    private String videoViewTopic;

    public String getSignedPlaylist(String videoId) {
        try {
            String basePath = "processed/" + videoId + "/";

            InputStream stream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(basePath + "index.m3u8")
                            .build()
            );

            String playlist = new String(stream.readAllBytes(), StandardCharsets.UTF_8);

            return Arrays.stream(playlist.split("\n"))
                    .map(line -> rewriteLine(line, basePath))
                    .collect(Collectors.joining("\n"));

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signed playlist", e);
        }
    }

    private String rewriteLine(String line, String basePath) {
        line = line.trim();

        if (line.endsWith(".ts")) {
            return generateSignedUrl(basePath + line);
        }

        return line;
    }

    private String generateSignedUrl(String objectPath) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .bucket(bucketName)
                            .object(objectPath)
                            .method(Method.GET)
                            .expiry(SIGNED_URL_EXPIRY_SECONDS)
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign URL: " + objectPath, e);
        }
    }

    public String getSignedThumbnailUrl(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(SIGNED_URL_EXPIRY_SECONDS) // 1 hour
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to generate signed thumbnail url");
        }
        return null;
    }

    public VideoMetadataResponse getVideoInfo(String id) {
        VideoMetadata videoMetadata = videoMetadataRepository.findById(id).orElse(null);
        if (videoMetadata == null) {
            log.error("Video id {} not found", id);
            return null;
        }

        String thumbnailUrl = videoMetadata.getThumbnailPath();
        String signedThumbnailUrl = null;
        if (thumbnailUrl == null) {
            log.error("Thumbnail url {} not found", id);
        } else {
            signedThumbnailUrl = generateSignedUrl(thumbnailUrl);
        }


        return VideoMetadataResponse.builder()
                .id(id)
                .title(videoMetadata.getTitle())
                .description(videoMetadata.getDescription())
                .views(videoMetadata.getViews())
                .size(videoMetadata.getSize())
                .duration(videoMetadata.getDuration())
                .thumbnailUrl(signedThumbnailUrl)
                .channelName(videoMetadata.getChannelName())
                .build();
    }

    public List<String> getFeed() {
        return videoMetadataRepository.findAll().stream().filter(e -> e.getStatus().equalsIgnoreCase("READY")).map(VideoMetadata::getId).toList();
    }

    public void publishViewEvent(String videoId) {
        kafkaTemplate.send(videoViewTopic, videoId, new VideoViewEvent(videoId))
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish video view event: videoId={}", videoId, ex);
                    } else {
                        log.info("Published video view event: videoId={}, topic={}", videoId, videoViewTopic);
                    }
                });
    }

    @Transactional
    public void incrementViews(String videoId) {
        int updated = videoMetadataRepository.incrementViews(videoId);
        if (updated == 0) {
            throw new IllegalArgumentException("Video not found: " + videoId);
        }
    }
}
