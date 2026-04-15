package com.spring.videouploadservice.dto;

import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@RequiredArgsConstructor
public class UploadVideoRequestDto {
    private String title;
    private String description;
    private String username;
}
