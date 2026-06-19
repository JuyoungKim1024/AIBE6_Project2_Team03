package com.backend;

import org.mockito.Mockito;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;

@Configuration
public class TestMailConfig {

    @Bean
    @Primary
    JavaMailSender javaMailSender() {
        return Mockito.mock(JavaMailSender.class);
    }
}
