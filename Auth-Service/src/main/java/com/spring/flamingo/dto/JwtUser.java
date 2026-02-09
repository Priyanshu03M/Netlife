package com.spring.flamingo.dto;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public record JwtUser(String username, Collection<? extends GrantedAuthority> authorities) {
}
