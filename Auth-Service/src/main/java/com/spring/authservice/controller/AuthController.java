package com.spring.authservice.controller;

import com.spring.authservice.dto.JwtResponse;
import com.spring.authservice.dto.RefreshTokenRequest;
import com.spring.authservice.dto.UserLoginRequest;
import com.spring.authservice.dto.UserRegisterRequest;
import com.spring.authservice.service.AuthService;
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
