package com.spring.videouploadservice.controller;

import com.spring.videouploadservice.dto.VideoPageResponseDto;
import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.dto.UploadVideoDto;
import com.spring.videouploadservice.service.UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/videos")
public class UploadController {
    private final UploadService uploadService;

    @GetMapping
    public ResponseEntity<?> listVideos(@RequestParam(value = "cursor", required = false) String cursor) {
        try {
            VideoPageResponseDto response = uploadService.listVideos(cursor);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to fetch videos");
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestHeader("X-User-Id") String userId
    ) {
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(file, title, description, userId);

        try {
            UploadResponseDto response = uploadService.upload(uploadVideoDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed");
        }
    }
}
