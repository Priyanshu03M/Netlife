package com.spring.videouploadservice.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.web.multipart.MultipartFile;

@Builder
@Getter
public class UploadVideoDto {
    private MultipartFile file;
    private String title;
    private String description;
    private String userId;

    public String getContentType() {
        return file != null ? file.getContentType() : null;
    }

    public String getOriginalFilename() {
        return file != null ? file.getOriginalFilename() : null;
    }
}
