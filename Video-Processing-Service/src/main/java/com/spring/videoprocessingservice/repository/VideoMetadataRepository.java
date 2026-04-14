package com.spring.videoprocessingservice.repository;

import com.spring.videoprocessingservice.entity.VideoMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoMetadataRepository extends JpaRepository<VideoMetadata, String> {

    @Modifying
    @Query("""
        update VideoMetadata v
        set v.status = :processing
        where v.id = :id and v.status = :expected
    """)
    int markProcessingIfPending(
            @Param("id") String id,
            @Param("expected") String expected,
            @Param("processing") String processing
    );
}
