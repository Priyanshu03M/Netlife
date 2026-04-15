package com.spring.videoprocessingservice.service;

import com.spring.videoprocessingservice.dto.CompleteVideoRequestDto;
import com.spring.videoprocessingservice.entity.VideoMetadata;
import com.spring.videoprocessingservice.exception.StorageException;
import com.spring.videoprocessingservice.repository.VideoMetadataRepository;
import com.spring.videoprocessingservice.util.TempFileManager;
import io.minio.StatObjectArgs;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import io.minio.MinioClient;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProcessingService {

    private static final String STATUS_UPLOADED = "UPLOADED";
    private static final String STATUS_PROCESSING = "PROCESSING";
    private static final String STATUS_READY = "READY";
    private static final String STATUS_FAILED = "FAILED";

    private final VideoMetadataRepository videoMetadataRepository;
    private final MinioClient minioClient;
    private final TempFileManager tempFileManager;

    @Value("${minio.bucket}")
    private String bucketName;

    @Transactional
    public void initiateProcessing(CompleteVideoRequestDto payload) {
        Optional<VideoMetadata> videoMetadata = videoMetadataRepository.findById(payload.getVideoId());
        if (videoMetadata.isPresent() && videoMetadata.get().getStatus().equals(STATUS_UPLOADED)) {
            VideoMetadata video = videoMetadata.get();
            String objectKey = video.getObjectKey();
            log.info("Received video processing message: videoId={}, title={}", videoMetadata.get().getId(), videoMetadata.get().getTitle());

            Path outputDir = null;

            int updated = videoMetadataRepository.markProcessingIfPending(videoMetadata.get().getId(), STATUS_UPLOADED, STATUS_PROCESSING);
            if (updated == 0) {
                return;
            }

            try {
                minioClient.statObject(
                        StatObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectKey)
                                .build()
                );

                Path inputFile = tempFileManager.saveMinioObjectToTempFile(bucketName, objectKey, video.getId());

                System.out.println("Saved at: " + inputFile.toString());
                outputDir = inputFile.getParent();

                double duration = tempFileManager.getVideoDuration(inputFile);
                Path thumbnailPath = null;
                String thumbnailKey = null;
                try {
                    thumbnailPath = tempFileManager.generateThumbnail(inputFile, video.getId(), duration);
                    thumbnailKey = tempFileManager.uploadThumbnail(thumbnailPath, video.getId());
                } catch (Exception e) {
                    log.error("Thumbnail failed for {}", video.getId(), e);
                }

                tempFileManager.generateHls(inputFile, outputDir);

                String processedPath = tempFileManager.uploadHlsFolder(outputDir, video.getId());

                video.setProcessedPath(processedPath);
                video.setThumbnailPath(thumbnailKey);
                video.setDuration((int) duration);
                video.setStatus(STATUS_READY);
                video.setUpdatedAt(LocalDateTime.now());
                videoMetadataRepository.save(video);

                log.info("Video processing has been successfully completed");

            } catch (Exception e) {
                log.error("Processing failed for videoId={}", video.getId(), e);
                video.setStatus(STATUS_FAILED);
                video.setUpdatedAt(LocalDateTime.now());
                video.setErrorMessage(e.getMessage());
                videoMetadataRepository.save(video);
                throw new StorageException("Processing failed", e);

            } finally {
                if (outputDir != null) {
                    tempFileManager.cleanTempFolder(outputDir, video.getId());
                }
            }
        }
    }
}
