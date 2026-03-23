package com.spring.apigatewayservice;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;

@Configuration
public class GatewayRoutesConfig {

    @Bean
    RouterFunction<ServerResponse> gatewayRoutes(GatewayRequestUserIdFilter gatewayRequestUserIdFilter) {
        return route("auth-service")
                .route(RequestPredicates.path("/auth/**"), http())
                .before(uri("lb://AUTHSERVICE"))
                .build()
                .and(
                        route("video-upload-service")
                                .route(RequestPredicates.path("/videos")
                                        .or(RequestPredicates.path("/videos/**")), http())
                                .before(uri("lb://VIDEOUPLOADSERVICE"))
                                .before(gatewayRequestUserIdFilter.addAuthenticatedUserIdHeader())
                                .build()
                )
                .and(
                        route("message-service")
                                .route(RequestPredicates.path("/message/**"), http())
                                .before(uri("lb://MESSAGESERVCIE"))
                                .build()
                );
    }
}
