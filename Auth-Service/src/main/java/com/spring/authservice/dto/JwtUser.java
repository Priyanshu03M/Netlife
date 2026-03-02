package com.spring.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public record JwtUser(
        @NotBlank(message = "Username is required") String username,
        @NotNull(message = "Authorities are required")
        @NotEmpty(message = "Authorities must not be empty") Collection<? extends GrantedAuthority> authorities
) {
}
