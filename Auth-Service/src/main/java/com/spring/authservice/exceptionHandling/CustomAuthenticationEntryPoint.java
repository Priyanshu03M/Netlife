package com.spring.authservice.exceptionHandling;

import com.spring.authservice.util.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, @NonNull AuthenticationException authException) throws IOException, ServletException {
        response.setHeader("WWW-Authenticate", "Auth Failed");
//        response.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        String path = request.getRequestURL().toString();
        String message = authException.getMessage() != null ? authException.getMessage() : "Unauthorized";
        ErrorResponse errorResponse = ErrorResponse.builder().timestamp(LocalDateTime.now()).status(HttpStatus.UNAUTHORIZED.value()).error(HttpStatus.UNAUTHORIZED.getReasonPhrase()).errorMessage(message).path(path).build();
        response.getWriter().write(errorResponse.toString());
    }
}
