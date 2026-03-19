package com.spring.videouploadservice.repository;

import com.spring.videouploadservice.entity.VideoMetadata;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface VideoMetadataRepository extends JpaRepository<VideoMetadata, UUID> {
    @Query("""
            select v
            from VideoMetadata v
            where v.status = :status
              and (
                :searchTerm is null
                or lower(v.title) like lower(concat('%', :searchTerm, '%'))
                or lower(coalesce(v.description, '')) like lower(concat('%', :searchTerm, '%'))
                or lower(v.channelName) like lower(concat('%', :searchTerm, '%'))
              )
              and (
                :cursorCreatedAt is null
                or v.createdAt < :cursorCreatedAt
                or (v.createdAt = :cursorCreatedAt and v.id < :cursorId)
              )
            order by v.createdAt desc, v.id desc
            """)
    List<VideoMetadata> findPageByStatusAndCursor(
            @Param("status") String status,
            @Param("searchTerm") String searchTerm,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") UUID cursorId,
            Pageable pageable
    );
}
