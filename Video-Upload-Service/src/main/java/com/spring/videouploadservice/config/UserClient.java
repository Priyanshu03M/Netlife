package com.spring.videouploadservice.config;

import com.spring.videouploadservice.dto.UserInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "USERSERVICE")
public interface UserClient {

    @GetMapping("/users/{username}/info")
    UserInfo getUserInfo(@PathVariable("username") String username);
}
