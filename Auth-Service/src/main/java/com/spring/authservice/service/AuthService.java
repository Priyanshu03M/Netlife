package com.spring.authservice.service;

import com.spring.authservice.config.JwtUtil;
import com.spring.authservice.dto.*;
import com.spring.authservice.entity.Person;
import com.spring.authservice.entity.RefreshToken;
import com.spring.authservice.exception.InvalidRefreshTokenException;
import com.spring.authservice.repository.PersonRepository;
import com.spring.authservice.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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

    public String registerUser(UserRegisterRequest userRegisterRequest) {
        String username = userRegisterRequest.getUsername().trim();
        String email = userRegisterRequest.getEmail().trim().toLowerCase(Locale.ROOT);

        if (personRepository.existsByUsername(username)) {
            throw new IllegalStateException("Username already exists, Try another");
        }

        if (personRepository.existsByEmail(email)) {
            throw new IllegalStateException("Email already exists. Try login");
        }

        String encodedPassword = passwordEncoder.encode(userRegisterRequest.getPassword());
        String role = userRegisterRequest.getRole();
        if(!role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }
        Person person = Person.builder()
                .id(UUID.randomUUID().toString())
                .username(username)
                .email(email)
                .password(encodedPassword)
                .role(role)
                .createdAt(LocalDateTime.now())
                .build();
        personRepository.save(person);
        return "Person Saved";
    }

    public JwtResponse login(UserLoginRequest request) {

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                );

        Authentication authentication = authenticationManager.authenticate(authToken);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        JwtUser user = new JwtUser(userDetails.getUsername(), userDetails.getAuthorities());

        String refreshToken = generateRefreshToken(request.getUsername());
        String accessToken = jwtUtil.generateAccessToken(user);
        return JwtResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
    }

    private String generateRefreshToken(String username) {
        String token = UUID.randomUUID().toString();
        Person person = personRepository.findByUsername(username);
        if (person == null) {
            throw new IllegalStateException("User not found while creating refresh token");
        }
        RefreshToken refreshToken = RefreshToken.builder().token(token).person(person).expiryDate(LocalDateTime.now().plusHours(1)).build();
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
