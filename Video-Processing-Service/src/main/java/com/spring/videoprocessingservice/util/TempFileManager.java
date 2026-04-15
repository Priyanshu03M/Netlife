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

    public Path generateThumbnail(Path inputFile, String videoId, double durationSeconds) {
        try {
            Path thumbnailDir = inputFile.getParent().resolve("thumbnail");
            Files.createDirectories(thumbnailDir);

            Path thumbnailPath = thumbnailDir.resolve("cover.jpg");

            Process process = getProcess(inputFile, durationSeconds, thumbnailPath);

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {

                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("[THUMBNAIL] {}", line);
                }
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("Thumbnail generation failed: " + exitCode);
            }

            return thumbnailPath;

        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thumbnail generation error", e);
        }
    }

    private static Process getProcess(Path inputFile, double durationSeconds, Path thumbnailPath) throws IOException {
        double captureTime = Math.max(1, Math.min(5, durationSeconds * 0.25));

        ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg",
                "-y",
                "-ss", String.valueOf(captureTime),
                "-i", inputFile.toAbsolutePath().toString(),
                "-frames:v", "1",
                "-vf", "scale=640:-1",
                "-q:v", "2",
                thumbnailPath.toAbsolutePath().toString()
        );

        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();
        return process;
    }

    public String uploadThumbnail(Path thumbnailPath, String videoId) {
        String objectKey = "thumbnails/" + videoId + "/cover.jpg";

        try (InputStream inputStream = Files.newInputStream(thumbnailPath)) {

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(inputStream, Files.size(thumbnailPath), -1)
                            .contentType("image/jpeg")
                            .build()
            );

            log.info("Uploaded thumbnail: {}", objectKey);
            return objectKey;

        } catch (Exception e) {
            throw new RuntimeException("Failed to upload thumbnail", e);
        }
    }

    public double getVideoDuration(Path inputFile) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    inputFile.toAbsolutePath().toString()
            );

            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            String output = reader.readLine();
            int exitCode = process.waitFor();

            if (exitCode != 0 || output == null) {
                throw new RuntimeException("Failed to get duration");
            }

            return Double.parseDouble(output.trim());

        } catch (Exception e) {
            throw new RuntimeException("Error getting video duration", e);
        }
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