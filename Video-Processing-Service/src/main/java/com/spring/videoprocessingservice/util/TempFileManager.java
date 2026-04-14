package com.spring.videoprocessingservice.util;

import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;

@Component
@Slf4j
@RequiredArgsConstructor
public class TempFileManager {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    public Path saveMinioObjectToTempFile(String bucketName, String objectKey, String id) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectKey)
                        .build()
        )) {

            Path tempDir = Files.createTempDirectory("video-" + id + "-");
            Path tempFile = tempDir.resolve("input.mp4");
            Files.copy(stream, tempFile, StandardCopyOption.REPLACE_EXISTING);

            return tempFile;

        } catch (Exception e) {
            throw new RuntimeException("Failed to download file from MinIO", e);
        }
    }

    public void generateHls(Path inputFile, Path outputDir) {
        try {
            Files.createDirectories(outputDir);
            Process process = getProcess(inputFile, outputDir);
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            String line;
            while ((line = reader.readLine()) != null) {
                log.info("[FFMPEG] {}", line);
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("FFmpeg failed with exit code: " + exitCode);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error running FFmpeg", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("FFmpeg execution interrupted", e);
        }
    }

    public String uploadHlsFolder(Path outputDir, String videoId) {
        AtomicReference<String> processedPath = new AtomicReference<>();
        try (Stream<Path> paths = Files.list(outputDir)) {
            paths.forEach(path -> {
                if (Files.isRegularFile(path)) {
                    String fileName = path.getFileName().toString();
                    if (!fileName.endsWith(".ts") && !fileName.endsWith(".m3u8")) return;

                    String objectKey = "processed/" + videoId + "/" + fileName;

                    if(fileName.endsWith(".m3u8")) {
                        processedPath.set(objectKey);
                    }

                    String contentType = getContentType(fileName);

                    try (InputStream inputStream = Files.newInputStream(path)) {

                        minioClient.putObject(
                                PutObjectArgs.builder()
                                        .bucket(bucketName)
                                        .object(objectKey)
                                        .stream(inputStream, Files.size(path), -1)
                                        .contentType(contentType)
                                        .build()
                        );

                        System.out.println("Uploaded: " + objectKey);

                    } catch (Exception e) {
                        throw new RuntimeException("Failed to upload: " + fileName, e);
                    }
                }
            });
        } catch (IOException e) {
            throw new RuntimeException("Error reading HLS folder", e);
        }
        return processedPath.get();
    }

    public void cleanTempFolder(Path tempDir, String videoId) {
        if (!tempDir.toString().contains("video-" + videoId + "-")) {
            throw new RuntimeException("Unsafe delete prevented");
        }
        try {
            if (Files.exists(tempDir)) {
                Files.walk(tempDir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(file -> {
                            if (!file.delete()) {
                                System.err.println("Failed to delete: " + file.getAbsolutePath());
                            }
                        });
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to clean temp folder", e);
        }
    }

    private static Process getProcess(Path inputFile, Path outputDir) throws IOException {
        Path outputPlaylist = outputDir.resolve("index.m3u8");

        ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg",
                "-i", inputFile.toAbsolutePath().toString(),
                "-codec", "copy",
                "-start_number", "0",
                "-hls_time", "10",
                "-hls_list_size", "0",
                "-f", "hls",
                outputPlaylist.toAbsolutePath().toString()
        );

        processBuilder.redirectErrorStream(true);

        return processBuilder.start();
    }

    private String getContentType(String fileName) {
        if (fileName.endsWith(".m3u8")) {
            return "application/vnd.apple.mpegurl";
        } else if (fileName.endsWith(".ts")) {
            return "video/MP2T";
        } else if (fileName.endsWith(".mp4")) {
            return "video/mp4";
        }
        return "application/octet-stream";
    }
}