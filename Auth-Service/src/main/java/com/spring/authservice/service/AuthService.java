package com.spring.authservice.service;

import com.spring.authservice.config.Constant;
import com.spring.authservice.config.CustomUserDetails;
import com.spring.authservice.config.JwtUtil;
import com.spring.authservice.dto.*;
import com.spring.authservice.entity.Person;
import com.spring.authservice.entity.RefreshToken;
import com.spring.authservice.exception.InvalidRefreshTokenException;
import com.spring.authservice.repository.PersonRepository;
import com.spring.authservice.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final PersonRepository personRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${refresh-token-expiration}")
    private long EXPIRATION;

    @Transactional
    public String registerUser(UserRegisterRequest userRegisterRequest) {
        String username = userRegisterRequest.getUsername().trim().toLowerCase(Locale.ROOT);
        String email = userRegisterRequest.getEmail().trim().toLowerCase(Locale.ROOT);

        String encodedPassword = passwordEncoder.encode(userRegisterRequest.getPassword());
        Person person = Person.builder()
                .id(UUID.randomUUID().toString())
                .username(username)
                .email(email)
                .password(encodedPassword)
                .role(Constant.ROLE_USER)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            personRepository.save(person);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Username or email already exists");
        }
        return Constant.SUCCESS;
    }

    public JwtResponse login(UserLoginRequest request) {

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail().trim().toLowerCase(),
                        request.getPassword()
                );

        Authentication authentication = authenticationManager.authenticate(authToken);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        JwtUser user = new JwtUser(userDetails.getUsername(), userDetails.getAuthorities());

        String refreshToken = generateRefreshToken(userDetails.getPerson());
        String accessToken = jwtUtil.generateAccessToken(user);
        return JwtResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
    }

    private String generateRefreshToken(Person person) {
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder().token(token).person(person).expiryDate(LocalDateTime.now().plusDays(EXPIRATION)).build();
        refreshTokenRepository.save(refreshToken);
        return token;
    }

    public JwtResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        Optional<RefreshToken> refreshTokenOpt = refreshTokenRepository.getByToken(refreshTokenRequest.getRefreshToken());
        if (refreshTokenOpt.isPresent() && !refreshTokenOpt.get().getExpiryDate().isBefore(LocalDateTime.now())) {
            Person person = refreshTokenOpt.get().getPerson();
            List<GrantedAuthority> grantedAuthorities =
                    List.of(new SimpleGrantedAuthority(person.getRole()));
            JwtUser user = new JwtUser(person.getUsername(), grantedAuthorities);
            String accessToken = jwtUtil.generateAccessToken(user);
            return JwtResponse.builder().accessToken(accessToken).refreshToken(refreshTokenOpt.get().getToken()).build();
        }
        throw new InvalidRefreshTokenException("Refresh token is invalid or expired");
    }

    @Transactional
    public String logout(RefreshTokenRequest refreshTokenRequest) {
        Optional<RefreshToken> refreshTokenOpt = refreshTokenRepository.getByToken(refreshTokenRequest.getRefreshToken());
        if (refreshTokenOpt.isPresent() && !refreshTokenOpt.get().getExpiryDate().isBefore(LocalDateTime.now())) {
            Person person = refreshTokenOpt.get().getPerson();
            refreshTokenRepository.deleteAllByPerson(person);
            return "User Logged out";
        }
        throw new InvalidRefreshTokenException("Refresh token is invalid or expired");
    }
}
