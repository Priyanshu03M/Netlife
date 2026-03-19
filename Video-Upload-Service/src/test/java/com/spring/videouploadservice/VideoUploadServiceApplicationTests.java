package com.spring.videouploadservice;

import com.spring.videouploadservice.repository.VideoMetadataRepository;
import io.minio.MinioClient;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
		"DB_URL=jdbc:postgresql://localhost:5432/test",
		"DB_USERNAME=test",
		"DB_PASSWORD=test",
		"EUREKA_SERVER_URL=http://localhost:8761/eureka",
		"eureka.client.enabled=false",
		"spring.cloud.discovery.enabled=false",
		"spring.autoconfigure.exclude=" +
				"org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration," +
				"org.springframework.boot.orm.jpa.autoconfigure.HibernateJpaAutoConfiguration," +
				"org.springframework.boot.data.jpa.autoconfigure.JpaRepositoriesAutoConfiguration," +
				"org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration"
})
class VideoUploadServiceApplicationTests {

	@MockitoBean
	private VideoMetadataRepository videoMetadataRepository;

	@MockitoBean
	private MinioClient minioClient;

	@Test
	void contextLoads() {
	}

}
