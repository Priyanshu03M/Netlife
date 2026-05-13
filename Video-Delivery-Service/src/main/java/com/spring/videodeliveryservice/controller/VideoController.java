package com.spring.videodeliveryservice.controller;

import com.spring.videodeliveryservice.dto.VideoMetadataResponse;
import com.spring.videodeliveryservice.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/videos")
public class VideoController {

    private final VideoService videoService;

    @GetMapping("/{videoId}/play")
    public ResponseEntity<String> playVideo(@PathVariable String videoId) {
        String playlist = videoService.getSignedPlaylist(videoId);
        videoService.publishViewEvent(videoId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .body(playlist);
    }

    @GetMapping("/{videoId}")
    public ResponseEntity<VideoMetadataResponse> getVideo(@PathVariable String videoId) {
        return ResponseEntity.ok(videoService.getVideoInfo(videoId));
    }

    @GetMapping("/{userId}/feed")
    public ResponseEntity<List<String>> getUserFeed(@PathVariable String userId) {
        return ResponseEntity.ok(videoService.getUserFeed(userId));
    }

    @GetMapping("/{username}/feed/me")
    public ResponseEntity<List<String>> getMyFeed(@PathVariable String username) {
        return ResponseEntity.ok(videoService.getFeed());
    }

    @GetMapping("/{username}/feed/recommendation")
    public ResponseEntity<List<String>> getRecommendationFeed(@PathVariable String username) {
        return ResponseEntity.ok(videoService.getFeed());
    }

    @GetMapping("/feed/trending")
    public ResponseEntity<List<String>> getTrendingFeed() {
        return ResponseEntity.ok(videoService.getFeed());
    }

    @DeleteMapping("/{userId}/{videoId}")
    public ResponseEntity<Boolean> deleteUserVideo(@PathVariable String userId, @PathVariable String videoId) {
        Boolean response = videoService.markVideoDeleted(userId, videoId);
        return ResponseEntity.ok(response);
    }
}
