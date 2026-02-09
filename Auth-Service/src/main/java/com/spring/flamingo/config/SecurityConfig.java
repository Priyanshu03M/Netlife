package com.spring.flamingo.config;

import com.spring.flamingo.exceptionHandling.CustomAccessDeniedHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import com.spring.flamingo.exceptionHandling.CustomAuthenticationEntryPoint;

@Component
@RequiredArgsConstructor
@EnableWebSecurity
@Slf4j
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) {

        log.trace("Configuring SecurityFilterChain");

        http
                .logout(AbstractHttpConfigurer::disable)
                .csrf(csrf -> {
                    log.trace("Disabling CSRF");
                    csrf.disable();
                })
                .sessionManagement(sm -> {
                    log.trace("Setting session policy to STATELESS");
                    sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                })
                .exceptionHandling(ex -> {
                    log.trace("Setting AuthenticationEntryPoint");
                    ex.authenticationEntryPoint(authenticationEntryPoint);
                    ex.accessDeniedHandler(customAccessDeniedHandler);
                })
                .authorizeHttpRequests(requests -> {
                    log.trace("Configuring authorization rules");

                    requests
                            .requestMatchers("/auth/register", "/auth/login", "/auth/refresh").permitAll()
                            .requestMatchers("/auth/pages1").hasRole("ADMIN")
                            .requestMatchers("/auth/pages", "/auth/logout").authenticated()
                            .anyRequest().authenticated();
                })
        ;

        log.trace("JwtAuthFilter added before UsernamePasswordAuthenticationFilter");

        return http.build();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) {
        log.trace("Exposing AuthenticationManager bean");
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        log.trace("Creating DelegatingPasswordEncoder");
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
