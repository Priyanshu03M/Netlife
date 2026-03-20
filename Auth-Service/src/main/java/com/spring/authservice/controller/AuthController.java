package com.spring.authservice.controller;

import com.spring.authservice.dto.JwtResponse;
import com.spring.authservice.dto.RefreshTokenRequest;
import com.spring.authservice.dto.UserLoginRequest;
import com.spring.authservice.dto.UserRegisterRequest;
import com.spring.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public String registerUser(@Valid @RequestBody UserRegisterRequest userRegisterRequest) {
        return authService.registerUser(userRegisterRequest);
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody UserLoginRequest request) {
        JwtResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public JwtResponse refresh(@Valid @RequestBody RefreshTokenRequest refreshTokenRequest) {
        return authService.refreshToken(refreshTokenRequest);
    }

    @PostMapping("/logout")
    public String logout(@Valid @RequestBody RefreshTokenRequest refreshTokenRequest) {
        return authService.logout(refreshTokenRequest);
    }

}
