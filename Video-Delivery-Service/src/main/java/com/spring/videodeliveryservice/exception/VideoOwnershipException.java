package com.spring.videodeliveryservice.exception;

public class VideoOwnershipException extends RuntimeException {

    public VideoOwnershipException(String videoId, String userId) {
        super("Video " + videoId + " does not belong to user " + userId);
    }
}
