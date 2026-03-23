package com.spring.apigatewayservice;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.filter.LoadBalancerFilterFunctions.lb;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;

@Configuration
public class GatewayRoutesConfig {

    @Bean
    RouterFunction<ServerResponse> gatewayRoutes(GatewayRequestUserIdFilter gatewayRequestUserIdFilter) {
        return route("auth-service")
                .route(RequestPredicates.path("/auth/**"), http())
                .filter(lb("AUTHSERVICE"))
                .build()
                .and(
                        route("video-upload-service")
                                .route(RequestPredicates.path("/videos")
                                        .or(RequestPredicates.path("/videos/**")), http())
                                .filter(lb("VIDEOUPLOADSERVICE"))
                                .before(gatewayRequestUserIdFilter.addAuthenticatedUserIdHeader())
                                .build()
                )
                .and(
                        route("message-service")
                                .route(RequestPredicates.path("/message/**"), http())
                                .filter(lb("MESSAGESERVICE"))
                                .build()
                );
    }
}
