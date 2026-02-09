package com.spring.flamingo.config;

import com.spring.flamingo.dto.JwtUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@Slf4j
public class JwtUtil {
    @Value("${jwt.secret}")
    private String SECRET;
    @Value("${jwt.expiration-ms}")
    private long EXPIRATION;

    public String generateAccessToken(JwtUser user) {
        log.trace("Generating JWT token for user: {}", user.username());
        String token = Jwts.builder()
                .setSubject(user.username())
                .claim("roles", user.authorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes()), SignatureAlgorithm.HS256)
                .compact();
        log.trace("JWT token generated successfully");
        return token;
    }

    public Claims validateToken(String token) {
        log.trace("Validating JWT token");
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody();
        log.trace("JWT token validated successfully");
        return claims;
    }
}
