package com.spring.videodeliveryservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VideoDeliveryServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(VideoDeliveryServiceApplication.class, args);
	}

}
