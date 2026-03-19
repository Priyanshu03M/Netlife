package com.spring.videouploadservice.controller;

import com.spring.videouploadservice.dto.ApiResponse;
import com.spring.videouploadservice.dto.CursorPageResponse;
import com.spring.videouploadservice.dto.UploadResponseDto;
import com.spring.videouploadservice.dto.UploadVideoDto;
import com.spring.videouploadservice.dto.VideoResponseDto;
import com.spring.videouploadservice.service.UploadService;
import com.spring.videouploadservice.service.VideoQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/videos")
public class VideoController {
    private final UploadService uploadService;
    private final VideoQueryService videoQueryService;

    @GetMapping
    public ResponseEntity<ApiResponse<CursorPageResponse<VideoResponseDto>>> listVideos(
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "limit", required = false) Integer limit
    ) {
        log.info("Received list videos request: cursorPresent={}, query='{}', limit={}",
                cursor != null && !cursor.isBlank(),
                query,
                limit);
        CursorPageResponse<VideoResponseDto> response = videoQueryService.listVideos(cursor, query, limit);
        log.info("List videos request completed: itemsReturned={}, hasMore={}",
                response.getItems().size(),
                response.isHasMore());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<UploadResponseDto>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-Channel-Name", required = false) String channelName
    ) {
        log.info("Received upload request: userId={}, channelName='{}', title='{}', fileName='{}', size={}",
                userId,
                channelName,
                title,
                file != null ? file.getOriginalFilename() : null,
                file != null ? file.getSize() : null);
        UploadVideoDto uploadVideoDto = UploadVideoDto.of(file, title, description, userId);
        UploadResponseDto response = uploadService.upload(uploadVideoDto, channelName);
        log.info("Upload request completed: objectKey={}, status={}", response.getObjectKey(), response.getStatus());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }
}
