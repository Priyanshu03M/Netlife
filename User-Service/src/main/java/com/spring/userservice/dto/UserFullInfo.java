package com.spring.userservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserFullInfo {
    private String username;
    private String channelName;
    private String bio;
    private String profilePictureUrl;

    private long followersCount;
    private long followingCount;
    private long videosCount;
}
