package com.spring.videodeliveryservice.controller;

import com.spring.videodeliveryservice.dto.VideoMetadataResponse;
import com.spring.videodeliveryservice.service.VideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/videos")
public class VideoController {

    private final VideoService videoService;

    @GetMapping("/{id}/play")
    public ResponseEntity<String> playVideo(@PathVariable String id) {
        String playlist = videoService.getSignedPlaylist(id);

        if (playlist == null) {
            return ResponseEntity.notFound().build();
        }

        videoService.publishViewEvent(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .body(playlist);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoMetadataResponse> getVideo(@PathVariable String id) {
        VideoMetadataResponse videoMetadataResponse = videoService.getVideoInfo(id);

        if (videoMetadataResponse == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(videoMetadataResponse);
    }

    @GetMapping("/feed")
    public ResponseEntity<List<String>> getFeed() {
        List<String> response = videoService.getFeed();
        return ResponseEntity.ok().body(response);
    }
}
