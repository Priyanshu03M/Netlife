package com.spring.videodeliveryservice.repository;

import com.spring.videodeliveryservice.entity.VideoMetadata;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoMetadataRepository extends JpaRepository<VideoMetadata, String> {
    @Modifying
    @Transactional
    @Query("""
        update VideoMetadata v
        set v.views = v.views + 1
        where v.id = :videoId
    """)
    int incrementViews(@Param("videoId") String videoId);
}
