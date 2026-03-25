package com.spring.videouploadservice.controller;

import com.spring.videouploadservice.dto.CompleteVideoRequestDto;
import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.dto.UploadVideoRequestDto;
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

    @PostMapping("/initiate-upload")
    public ResponseEntity<UploadResponseDto> upload(@RequestBody UploadVideoRequestDto request) {
        String userId = UUID.randomUUID().toString(); // just for test -> to take from auth later
        request.setUserId(userId);
        log.info("Received upload request: userId={}, title='{}'", userId, request.getTitle());
        UploadResponseDto response = uploadService.uploadVideoMetadata(request);
        log.info("Upload request completed: videoId={}, videoUrl={}, status={}", response.getVideoId(), response.getUrl(), response.getStatus());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/complete-upload")
    public ResponseEntity<String> completeUpload(@RequestBody CompleteVideoRequestDto request) {
        return ResponseEntity.status(HttpStatus.OK).body(uploadService.completeUpload(request));
    }
}
