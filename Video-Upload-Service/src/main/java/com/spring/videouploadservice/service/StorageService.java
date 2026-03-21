package com.spring.videouploadservice.service;

import com.spring.videouploadservice.exception.StorageException;
import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class StorageService {
    private static final int PRESIGNED_URL_EXPIRY_DAYS = 1;

    private final MinioClient minioClient;

    @Getter
    @Value("${minio.bucket}")
    private String bucketName;

    public void uploadVideo(String objectKey, InputStream inputStream, long size, String contentType) {
        try {
            ensureBucketExists();
            log.debug("Putting object into MinIO: bucket={}, objectKey={}, size={}, contentType={}",
                    bucketName,
                    objectKey,
                    size,
                    contentType);
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(inputStream, size, -1)
                            .contentType(contentType)
                            .build()
            );
            log.debug("Object stored in MinIO: bucket={}, objectKey={}", bucketName, objectKey);
        } catch (Exception exception) {
            throw new StorageException("Failed to upload video to storage", exception);
        }
    }

    public void deleteObject(String objectKey) {
        try {
            log.debug("Deleting object from MinIO: bucket={}, objectKey={}", bucketName, objectKey);
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );
            log.info("Deleted object from MinIO: bucket={}, objectKey={}", bucketName, objectKey);
        } catch (Exception exception) {
            throw new StorageException("Failed to delete object from storage", exception);
        }
    }

    public String generatePresignedUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }

        try {
            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(PRESIGNED_URL_EXPIRY_DAYS, TimeUnit.DAYS)
                            .build()
            );
            log.debug("Generated presigned URL: bucket={}, objectKey={}, expiresInDays={}",
                    bucketName,
                    objectKey,
                    PRESIGNED_URL_EXPIRY_DAYS);
            return url;
        } catch (Exception exception) {
            throw new StorageException("Failed to generate presigned URL", exception);
        }
    }

    private void ensureBucketExists() throws Exception {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder()
                        .bucket(bucketName)
                        .build()
        );

        if (!exists) {
            log.warn("MinIO bucket missing. Creating bucket: {}", bucketName);
            minioClient.makeBucket(
                    MakeBucketArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
            log.info("Created MinIO bucket: {}", bucketName);
        }
    }
}
