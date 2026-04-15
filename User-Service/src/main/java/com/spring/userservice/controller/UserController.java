package com.spring.userservice.controller;

import com.spring.userservice.dto.UserInfo;
import com.spring.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/{username}/info")
    public ResponseEntity<UserInfo> getUserinfo(@PathVariable String username) {
        UserInfo response = userService.getUserInfo(username);
        return response == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(response);
    }
}
