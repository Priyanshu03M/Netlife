package com.spring.videodeliveryservice.service;

import com.spring.videodeliveryservice.dto.VideoMetadataResponse;
import com.spring.videodeliveryservice.entity.VideoMetadata;
import com.spring.videodeliveryservice.entity.VideoStatus;
import com.spring.videodeliveryservice.exception.VideoNotFoundException;
import com.spring.videodeliveryservice.exception.VideoOwnershipException;
import com.spring.videodeliveryservice.kafka.VideoEventPublisher;
import com.spring.videodeliveryservice.repository.VideoMetadataRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoService {

    private static final String PLAYLIST_FILE_NAME = "index.m3u8";
    private static final String PROCESSED_PREFIX = "processed/";
    private static final String RAW_PREFIX = "raw/";
    private static final String THUMBNAIL_PREFIX = "thumbnails/";

    private final VideoMetadataRepository videoMetadataRepository;
    private final MinioStorageService storageService;
    private final PlaylistService playlistService;
    private final VideoEventPublisher videoEventPublisher;

    public String getSignedPlaylist(String videoId) {
        String playlistObjectKey = buildPrefixedPath(PROCESSED_PREFIX, videoId) + PLAYLIST_FILE_NAME;

        try (InputStream stream = storageService.getObject(playlistObjectKey)) {
            String playlistContent = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
            return playlistService.rewriteSegmentUrls(playlistContent, buildPrefixedPath(PROCESSED_PREFIX, videoId));
        } catch (Exception exception) {
            log.error("Failed to load signed playlist for videoId={}", videoId, exception);
            throw new IllegalStateException("Failed to generate signed playlist for video " + videoId, exception);
        }
    }

    public VideoMetadataResponse getVideoInfo(String videoId) {
        VideoMetadata videoMetadata = findRequiredVideo(videoId);

        return VideoMetadataResponse.builder()
                .id(videoMetadata.getId())
                .title(videoMetadata.getTitle())
                .description(videoMetadata.getDescription())
                .views(videoMetadata.getViews())
                .size(videoMetadata.getSize())
                .duration(videoMetadata.getDuration())
                .thumbnailUrl(signThumbnail(videoMetadata))
                .channelName(videoMetadata.getChannelName())
                .createdAt(videoMetadata.getCreatedAt())
                .build();
    }

    public List<String> getFeed() {
        return videoMetadataRepository.findByStatusOrderByCreatedAtDesc(VideoStatus.READY)
                .stream()
                .map(VideoMetadata::getId)
                .toList();
    }

    public List<String> getUserFeed(String userId) {
        return videoMetadataRepository.findByStatusAndUserIdIgnoreCaseOrderByCreatedAtDesc(VideoStatus.READY, userId)
                .stream()
                .map(VideoMetadata::getId)
                .toList();
    }

    public void publishViewEvent(String videoId) {
        videoEventPublisher.publishViewEvent(videoId);
    }

    @Transactional
    public void incrementViews(String videoId) {
        int updated = videoMetadataRepository.incrementViews(videoId);
        if (updated == 0) {
            throw new VideoNotFoundException(videoId);
        }
    }

    @Transactional
    public Boolean markVideoDeleted(String userId, String videoId) {
        VideoMetadata videoMetadata = findRequiredVideo(videoId);
        validateOwnership(videoMetadata, userId);

        int updated = videoMetadataRepository.updateStatus(videoId, VideoStatus.DELETED);
        if (updated == 0) {
            throw new VideoNotFoundException(videoId);
        }

        log.info("Marked videoId={} as {}. video-delete job will purge storage objects.", videoId, VideoStatus.DELETED);
        return true;
    }

    @Transactional
    public void deleteUserVideo(String videoId) {
        VideoMetadata videoMetadata = findRequiredVideo(videoId);

        deleteVideoAssets(videoMetadata.getId());
        videoMetadataRepository.delete(videoMetadata);

        log.info("Purged deleted video assets and metadata for videoId={}", videoId);
    }

    public List<VideoMetadata> findDeletedVideos() {
        return videoMetadataRepository.findByStatus(VideoStatus.DELETED);
    }

    private void deleteVideoAssets(String videoId) {
        storageService.deleteByPrefix(buildPrefixedPath(PROCESSED_PREFIX, videoId));
        storageService.deleteByPrefix(buildPrefixedPath(RAW_PREFIX, videoId));
        storageService.deleteByPrefix(buildPrefixedPath(THUMBNAIL_PREFIX, videoId));
    }

    private String signThumbnail(VideoMetadata videoMetadata) {
        String thumbnailPath = videoMetadata.getThumbnailPath();
        if (thumbnailPath == null || thumbnailPath.isBlank()) {
            log.info("Thumbnail path missing for videoId={}", videoMetadata.getId());
            return null;
        }

        return storageService.generatePresignedUrl(thumbnailPath);
    }

    private VideoMetadata findRequiredVideo(String videoId) {
        return videoMetadataRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));
    }

    private void validateOwnership(VideoMetadata videoMetadata, String userId) {
        if (!videoMetadata.getUserId().equalsIgnoreCase(userId)) {
            throw new VideoOwnershipException(videoMetadata.getId(), userId);
        }
    }

    private String buildPrefixedPath(String prefix, String videoId) {
        return prefix + videoId + "/";
    }
}
