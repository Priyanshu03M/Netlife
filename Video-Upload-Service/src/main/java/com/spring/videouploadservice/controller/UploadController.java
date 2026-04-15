package com.spring.videouploadservice.controller;

import com.spring.videouploadservice.config.UserClient;
import com.spring.videouploadservice.dto.*;
import com.spring.videouploadservice.service.UploadService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@AllArgsConstructor
@Slf4j
@RequestMapping("/videos")
public class UploadController {

    private final UploadService uploadService;
    private final UserClient userApiService;

    @PostMapping("/initiate-upload")
    public ResponseEntity<UploadResponseDto> upload(@RequestBody UploadVideoRequestDto request) {
        UserInfo userInfo = userApiService.getUserInfo(request.getUsername());
        UploadBackendRequest uploadBackendRequest = UploadBackendRequest.builder().title(request.getTitle()).description(request.getDescription()).userId(userInfo.getId()).username(request.getUsername()).build();
        log.info("Received upload request: userId={}, title='{}'", userInfo.getId(), request.getTitle());
        UploadResponseDto response = uploadService.uploadVideoMetadata(uploadBackendRequest);
        log.info("Upload request completed: videoId={}, videoUrl={}, status={}", response.getVideoId(), response.getUrl(), response.getStatus());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/complete-upload")
    public ResponseEntity<String> completeUpload(@RequestBody CompleteVideoRequestDto request) {
        return ResponseEntity.status(HttpStatus.OK).body(uploadService.completeUpload(request));
    }
}
