package com.spring.messageservice.functions;

import com.spring.messageservice.dto.AccountMsgDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Function;

@Configuration
public class MessageFunction {
    private static final Logger logger = LoggerFactory.getLogger(MessageFunction.class);

    @Bean
    public Function<AccountMsgDto, AccountMsgDto> email() {
        return accountMsgDto -> {
            logger.info("Sending email {}", accountMsgDto.name());
            return accountMsgDto;
        };
    }
    @Bean
    public Function<AccountMsgDto, AccountMsgDto> sms() {
        return accountMsgDto -> {
            logger.info("Sending sms {}", accountMsgDto.name);
            return accountMsgDto;
        };
    }
}
