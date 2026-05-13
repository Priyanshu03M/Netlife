package com.spring.videodeliveryservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PlaylistService {

    private final MinioStorageService storageService;

    public String rewriteSegmentUrls(String playlistContent, String basePath) {
        return Arrays.stream(playlistContent.split("\n"))
                .map(line -> rewriteLine(line, basePath))
                .collect(Collectors.joining("\n"));
    }

    private String rewriteLine(String line, String basePath) {
        String normalizedLine = line.trim();
        if (normalizedLine.endsWith(".ts")) {
            return storageService.generatePresignedUrl(basePath + normalizedLine);
        }

        return normalizedLine;
    }
}
