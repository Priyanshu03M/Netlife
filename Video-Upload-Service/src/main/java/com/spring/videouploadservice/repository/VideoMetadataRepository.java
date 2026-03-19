package com.spring.videouploadservice.repository;

import com.spring.videouploadservice.entity.VideoMetadata;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VideoMetadataRepository extends JpaRepository<VideoMetadata, String> {

    // =========================
    // 1. FIRST PAGE (NO SEARCH)
    // =========================
    @Query("""
        select v
        from VideoMetadata v
        where v.status = :status
        order by v.createdAt desc, v.id desc
    """)
    List<VideoMetadata> findFirstPage(
            @Param("status") String status,
            Pageable pageable
    );

    // =========================
    // 2. NEXT PAGE (NO SEARCH)
    // =========================
    @Query("""
        select v
        from VideoMetadata v
        where v.status = :status
          and (
            v.createdAt < :cursorCreatedAt
            or (v.createdAt = :cursorCreatedAt and v.id < :cursorId)
          )
        order by v.createdAt desc, v.id desc
    """)
    List<VideoMetadata> findNextPage(
            @Param("status") String status,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") String cursorId,
            Pageable pageable
    );

    // =========================
    // 3. FIRST PAGE (WITH SEARCH)
    // =========================
    @Query("""
        select v
        from VideoMetadata v
        where v.status = :status
          and (
            lower(v.title) like lower(concat('%', :searchTerm, '%'))
            or lower(coalesce(v.description, '')) like lower(concat('%', :searchTerm, '%'))
            or lower(v.channelName) like lower(concat('%', :searchTerm, '%'))
          )
        order by v.createdAt desc, v.id desc
    """)
    List<VideoMetadata> findFirstPageWithSearch(
            @Param("status") String status,
            @Param("searchTerm") String searchTerm,
            Pageable pageable
    );

    // =========================
    // 4. NEXT PAGE (WITH SEARCH)
    // =========================
    @Query("""
        select v
        from VideoMetadata v
        where v.status = :status
          and (
            lower(v.title) like lower(concat('%', :searchTerm, '%'))
            or lower(coalesce(v.description, '')) like lower(concat('%', :searchTerm, '%'))
            or lower(v.channelName) like lower(concat('%', :searchTerm, '%'))
          )
          and (
            v.createdAt < :cursorCreatedAt
            or (v.createdAt = :cursorCreatedAt and v.id < :cursorId)
          )
        order by v.createdAt desc, v.id desc
    """)
    List<VideoMetadata> findNextPageWithSearch(
            @Param("status") String status,
            @Param("searchTerm") String searchTerm,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") String cursorId,
            Pageable pageable
    );
}
