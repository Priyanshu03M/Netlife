package com.spring.videodeliveryservice.kafka;

import com.spring.videodeliveryservice.dto.VideoViewEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class VideoEventPublisher {

    private final KafkaTemplate<String, VideoViewEvent> kafkaTemplate;

    @Value("${app.kafka.topic.video-view:video-view-topic}")
    private String videoViewTopic;

    public void publishViewEvent(String videoId) {
        kafkaTemplate.send(videoViewTopic, videoId, new VideoViewEvent(videoId))
                .whenComplete((result, exception) -> {
                    if (exception != null) {
                        log.error("Failed to publish video view event for videoId={}", videoId, exception);
                        return;
                    }

                    log.info("Published video view event for videoId={} to topic={}", videoId, videoViewTopic);
                });
    }
}
