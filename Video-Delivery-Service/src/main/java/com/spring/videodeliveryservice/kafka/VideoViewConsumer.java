package com.spring.videodeliveryservice.kafka;

import com.spring.videodeliveryservice.dto.VideoViewEvent;
import com.spring.videodeliveryservice.service.VideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoViewConsumer {

    private final VideoService videoService;

    @KafkaListener(
            topics = "${app.kafka.topic.video-view}",
            groupId = "${spring.kafka.consumer.group-id}"
    )
    public void consumeVideoViewEvent(VideoViewEvent payload) {
        if (payload == null || payload.getVideoId() == null || payload.getVideoId().isBlank()) {
            log.warn("Received video view event with missing videoId");
            return;
        }

        videoService.incrementViews(payload.getVideoId());
    }
}
