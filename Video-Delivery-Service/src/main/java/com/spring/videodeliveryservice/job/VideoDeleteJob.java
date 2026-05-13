package com.spring.videodeliveryservice.job;

import com.spring.videodeliveryservice.entity.VideoMetadata;
import com.spring.videodeliveryservice.service.VideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class VideoDeleteJob {

    private final VideoService videoService;

    @Scheduled(fixedDelayString = "${app.jobs.video-delete.fixed-delay-ms:60000}")
    public void run() {
        List<VideoMetadata> deletedVideos = videoService.findDeletedVideos();

        if (deletedVideos.isEmpty()) {
            return;
        }

        log.info("video-delete job found {} deleted video(s) to purge", deletedVideos.size());

        for (VideoMetadata video : deletedVideos) {
            String videoId = video.getId();

            try {
                videoService.deleteUserVideo(videoId);
                log.info("video-delete job purged videoId={}", videoId);
            } catch (Exception exception) {
                log.error("video-delete job failed for videoId={}", videoId, exception);
            }
        }
    }
}
