package com.spring.videouploadservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class VideoUploadServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(VideoUploadServiceApplication.class, args);
	}

}