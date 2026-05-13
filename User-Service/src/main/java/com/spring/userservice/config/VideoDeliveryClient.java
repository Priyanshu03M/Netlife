package com.spring.userservice.config;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;


@FeignClient(name = "VIDEODELIVERYSERVICE")
public interface VideoDeliveryClient {

    @GetMapping("/videos/{id}/feed")
    List<String> getUserVideos(@PathVariable("id") String id);

    @DeleteMapping("/videos/{userId}/{videoId}")
    Boolean deleteUserVideo(@PathVariable String userId, @PathVariable String videoId);
}
