package com.spring.videouploadservice.controller;

import com.spring.videouploadservice.dto.CompleteVideoRequestDto;
import com.spring.videouploadservice.dto.UploadBackendRequest;
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
    public ResponseEntity<UploadResponseDto> upload(@RequestBody UploadVideoRequestDto request,
                                                    @RequestHeader("X-Client-ID")  String clientId) {
        UploadBackendRequest uploadBackendRequest = UploadBackendRequest.builder().title(request.getTitle()).description(request.getDescription()).userId(clientId).build();
        log.info("Received upload request: userId={}, title='{}'", clientId, request.getTitle());
        UploadResponseDto response = uploadService.uploadVideoMetadata(uploadBackendRequest);
        log.info("Upload request completed: videoId={}, videoUrl={}, status={}", response.getVideoId(), response.getUrl(), response.getStatus());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/complete-upload")
    public ResponseEntity<String> completeUpload(@RequestBody CompleteVideoRequestDto request) {
        return ResponseEntity.status(HttpStatus.OK).body(uploadService.completeUpload(request));
    }
}
