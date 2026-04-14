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
    RouterFunction<ServerResponse> gatewayRoutes() {
        return route("auth-service")
                .route(RequestPredicates.path("/auth/**"), http())
                .filter(lb("AUTHSERVICE"))
                .build()
                .and(
                        route("video-upload-service")
                                .route(RequestPredicates.POST("/videos/initiate-upload"), http())
                                .route(RequestPredicates.POST("/videos/complete-upload"), http())
                                .filter(lb("VIDEOUPLOADSERVICE"))
                                .build()
                )
                .and(
                        route("video-delivery-service")
                                .route(RequestPredicates.GET("/videos/**"), http())
                                .filter(lb("VIDEODELIVERYSERVICE"))
                                .build()
                );
    }
}
