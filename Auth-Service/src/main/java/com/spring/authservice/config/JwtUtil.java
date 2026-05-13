package com.spring.authservice.config;

import com.spring.authservice.dto.JwtUser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HexFormat;

@Component
@Slf4j
public class JwtUtil {
    @Value("${jwt.secret}")
    private String SECRET;
    @Value("${jwt.expiration-ms}")
    private long EXPIRATION;

    public String generateAccessToken(JwtUser user) {
        Date issuedAt = new Date();
        Date expiresAt = new Date(System.currentTimeMillis() + EXPIRATION);
        String token = Jwts.builder()
                .setSubject(user.username())
                .claim("userId", user.userId())
                .claim("roles", user.authorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList())
                .setIssuedAt(issuedAt)
                .setExpiration(expiresAt)
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();

        return token;
    }

}
