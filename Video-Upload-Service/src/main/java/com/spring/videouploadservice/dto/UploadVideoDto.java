package com.spring.videouploadservice.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import org.springframework.web.multipart.MultipartFile;

@ToString(exclude = "file")
@Builder
@Getter
public class UploadVideoDto {
    private final MultipartFile file;
    private final String title;
    private final String description;
    private final String userId;

    public static UploadVideoDto of(MultipartFile file, String title, String description, String userId) {
        return UploadVideoDto.builder()
                .file(file)
                .title(normalize(title))
                .description(normalize(description))
                .userId(normalize(userId))
                .build();
    }

    public String getContentType() {
        return file != null ? file.getContentType() : null;
    }

    public String getOriginalFilename() {
        return file != null ? file.getOriginalFilename() : null;
    }

    public long getSize() {
        return file != null ? file.getSize() : 0L;
    }

    public boolean hasFile() {
        return file != null && !file.isEmpty();
    }

    public boolean isVideoFile() {
        return getContentType() != null && getContentType().startsWith("video/");
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
