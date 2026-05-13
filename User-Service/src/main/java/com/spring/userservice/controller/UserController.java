package com.spring.userservice.controller;

import com.spring.userservice.config.VideoDeliveryClient;
import com.spring.userservice.dto.UserFullInfo;
import com.spring.userservice.dto.UserInfo;
import com.spring.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final VideoDeliveryClient videoDeliveryClient;

    @GetMapping("/{username}/info")
    public ResponseEntity<UserInfo> getUserinfo(@PathVariable String username) {
        UserInfo response = userService.getUserInfo(username.toLowerCase());
        return response == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(response);
    }

    @GetMapping("{id}/videos")
    public ResponseEntity<List<String>> getVideos(@PathVariable String id) {
        List<String> userVideos = videoDeliveryClient.getUserVideos(id);
        return ResponseEntity.ok().body(userVideos);
    }

    @GetMapping("/{userId}/fullinfo")
    public ResponseEntity<UserFullInfo> getFullUserinfo(@PathVariable String userId) {
        UserFullInfo response = userService.getFullUserInfo(userId);
        return response == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}/videos/{videoId}")
    public ResponseEntity<Boolean> deleteUserVideo(@PathVariable String userId, @PathVariable String videoId) {
        Boolean response = videoDeliveryClient.deleteUserVideo(userId, videoId);
        return response == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(response);
    }


}
