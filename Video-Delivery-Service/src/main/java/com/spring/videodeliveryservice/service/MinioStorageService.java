package com.spring.videodeliveryservice.service;

import com.spring.videodeliveryservice.exception.StorageOperationException;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.RemoveObjectsArgs;
import io.minio.Result;
import io.minio.http.Method;
import io.minio.messages.DeleteError;
import io.minio.messages.DeleteObject;
import io.minio.messages.Item;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageService {

    private static final int SIGNED_URL_EXPIRY_SECONDS = 60 * 30;

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    public InputStream getObject(String objectKey) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );
        } catch (Exception exception) {
            throw new StorageOperationException("Failed to fetch object: " + objectKey, exception);
        }
    }

    public String generatePresignedUrl(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .method(Method.GET)
                            .expiry(SIGNED_URL_EXPIRY_SECONDS)
                            .build()
            );
        } catch (Exception exception) {
            throw new StorageOperationException("Failed to generate presigned URL for object: " + objectKey, exception);
        }
    }

    public void deleteByPrefix(String prefix) {
        List<DeleteObject> objects = listObjects(prefix);
        if (objects.isEmpty()) {
            log.info("No storage objects found for prefix={}", prefix);
            return;
        }

        try {
            Iterable<Result<DeleteError>> errors = minioClient.removeObjects(
                    RemoveObjectsArgs.builder()
                            .bucket(bucketName)
                            .objects(objects)
                            .build()
            );

            for (Result<DeleteError> error : errors) {
                DeleteError deleteError = error.get();
                throw new StorageOperationException("Failed to delete object: " + deleteError.objectName(), null);
            }
        } catch (StorageOperationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new StorageOperationException("Failed to delete objects for prefix: " + prefix, exception);
        }
    }

    private List<DeleteObject> listObjects(String prefix) {
        try {
            Iterable<Result<Item>> results = minioClient.listObjects(
                    ListObjectsArgs.builder()
                            .bucket(bucketName)
                            .prefix(prefix)
                            .recursive(true)
                            .build()
            );

            List<DeleteObject> objects = new ArrayList<>();
            for (Result<Item> result : results) {
                objects.add(new DeleteObject(result.get().objectName()));
            }

            return objects;
        } catch (Exception exception) {
            throw new StorageOperationException("Failed to list objects for prefix: " + prefix, exception);
        }
    }
}
