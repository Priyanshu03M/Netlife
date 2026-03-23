package com.spring.apigatewayservice;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.function.ServerRequest;

import java.util.function.Function;

@Component
public class GatewayRequestUserIdFilter {

    public static final String AUTHENTICATED_USER_ID_ATTR = "authenticatedUserId";
    public static final String USER_ID_HEADER = "X-User-Id";

    public Function<ServerRequest, ServerRequest> addAuthenticatedUserIdHeader() {
        return request -> {
            Object userIdAttr = request.attribute(AUTHENTICATED_USER_ID_ATTR).orElse(null);
            if (!(userIdAttr instanceof String userId) || userId.isBlank()) {
                return ServerRequest.from(request)
                        .headers(headers -> headers.remove(USER_ID_HEADER))
                        .build();
            }

            return ServerRequest.from(request)
                    .headers(headers -> {
                        headers.remove(USER_ID_HEADER);
                        headers.add(USER_ID_HEADER, userId);
                    })
                    .build();
        };
    }
}
