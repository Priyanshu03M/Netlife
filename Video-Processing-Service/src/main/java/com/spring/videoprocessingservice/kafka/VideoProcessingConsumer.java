package com.spring.videoprocessingservice.kafka;

import com.spring.videoprocessingservice.service.ProcessingService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.spring.videoprocessingservice.dto.CompleteVideoRequestDto;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Slf4j
public class VideoProcessingConsumer {
    private final ProcessingService processingService;

    @KafkaListener(
            topics = "${app.kafka.topic.video-uploaded}",
            groupId = "${spring.kafka.consumer.group-id}"
    )
    public void consumeVideoProcessingEvent(CompleteVideoRequestDto payload) {
        if (payload == null || payload.getVideoId() == null || payload.getVideoId().isBlank()) {
            log.warn("Received video processing message with missing videoId");
            return;
        }
        processingService.initiateProcessing(payload);
    }
}
