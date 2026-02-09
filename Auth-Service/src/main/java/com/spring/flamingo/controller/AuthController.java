package com.spring.flamingo.controller;

import com.spring.flamingo.dto.JwtResponse;
import com.spring.flamingo.dto.RefreshTokenRequest;
import com.spring.flamingo.dto.UserLoginRequest;
import com.spring.flamingo.dto.UserRegisterRequest;
import com.spring.flamingo.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public String registerUser(@RequestBody UserRegisterRequest userRegisterRequest) {
        return authService.registerUser(userRegisterRequest);
    }

    @GetMapping("/pages")
    public String getPages() {
        return "Here are the pages";
    }

    @GetMapping("/pages1")
    public String getPages1() {
        return "Here are the confidential pages of the ";
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody UserLoginRequest request) {
        JwtResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public JwtResponse refresh(@RequestBody RefreshTokenRequest refreshTokenRequest) {
        return authService.refreshToken(refreshTokenRequest);
    }

    @PostMapping("/logout")
    public String logout(@RequestBody RefreshTokenRequest refreshTokenRequest) {
        return authService.logout(refreshTokenRequest);
    }

}
