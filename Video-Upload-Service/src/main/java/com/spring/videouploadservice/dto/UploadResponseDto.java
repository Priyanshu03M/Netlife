package com.spring.videouploadservice.dto;

import lombok.*;

@Getter
@Builder
@Setter
@AllArgsConstructor
@RequiredArgsConstructor
public class UploadResponseDto {
    private String status;
    private String url;
    private String videoId;
}
