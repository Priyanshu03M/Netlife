package com.spring.videodeliveryservice.exception;

public class VideoNotFoundException extends RuntimeException {

    public VideoNotFoundException(String videoId) {
        super("Video not found: " + videoId);
    }
}
