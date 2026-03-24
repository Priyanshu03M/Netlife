package com.spring.apigatewayservice;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import java.util.List;

import static org.springframework.cloud.gateway.server.mvc.filter.LoadBalancerFilterFunctions.lb;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;

@Configuration
public class GatewayRoutesConfig {

    public static final List<String> PUBLIC_URLS = List.of(
            "/auth/login",
            "/auth/register",
            "/auth/refresh",
            "/auth/logout",
            "/videos/fetch"
    );
    public static final List<String> PRIVATE_URLS = List.of(
            "/videos/upload"
    );

    @Bean
    RouterFunction<ServerResponse> gatewayRoutes() {
        return route()
                .path("/auth/**", builder -> builder
                        .route(RequestPredicates.all(), http())
                        .filter(lb("AUTHSERVICE"))
                )
                .path("/videos/**", builder -> builder
                        .route(RequestPredicates.all(), http())
                        .filter(lb("VIDEOUPLOADSERVICE"))
                )
                .build();
    }
}
