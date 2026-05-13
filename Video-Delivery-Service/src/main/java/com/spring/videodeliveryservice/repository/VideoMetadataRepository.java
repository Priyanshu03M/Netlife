package com.spring.videodeliveryservice.repository;

import com.spring.videodeliveryservice.entity.VideoMetadata;
import com.spring.videodeliveryservice.entity.VideoStatus;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VideoMetadataRepository extends JpaRepository<VideoMetadata, String> {
    List<VideoMetadata> findByStatusOrderByCreatedAtDesc(VideoStatus status);

    List<VideoMetadata> findByStatusAndUserIdIgnoreCaseOrderByCreatedAtDesc(VideoStatus status, String userId);

    List<VideoMetadata> findByStatus(VideoStatus status);

    @Modifying
    @Transactional
    @Query("""
        update VideoMetadata v
        set v.views = v.views + 1
        where v.id = :videoId
    """)
    int incrementViews(@Param("videoId") String videoId);

    @Modifying
    @Transactional
    @Query("""
        update VideoMetadata v
        set v.status = :status
        where v.id = :videoId
    """)
    int updateStatus(@Param("videoId") String videoId, @Param("status") VideoStatus status);

}
