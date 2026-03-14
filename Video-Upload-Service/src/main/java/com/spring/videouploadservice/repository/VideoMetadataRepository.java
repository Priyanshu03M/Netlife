package com.spring.videouploadservice.repository;

import com.spring.videouploadservice.entity.VideoMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
public interface VideoMetadataRepository extends JpaRepository<VideoMetadata, String> {

}
