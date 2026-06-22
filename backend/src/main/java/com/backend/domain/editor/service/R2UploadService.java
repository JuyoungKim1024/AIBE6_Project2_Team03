package com.backend.domain.editor.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class R2UploadService {

    private final S3Client r2Client;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    @Value("${cloudflare.r2.public-url}")
    private String publicUrl;

    public R2UploadService(S3Client r2Client) {
        this.r2Client = r2Client;
    }

    public String upload(MultipartFile file) throws IOException {
        // 기존 게시글·포트폴리오 업로드 경로를 유지한다.
        return upload(file, "");
    }

    public String upload(MultipartFile file, String directory) throws IOException {
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : "";
        String key = createKey(directory, ext);
        String contentType = file.getContentType() == null
                ? "application/octet-stream"
                : file.getContentType();

        r2Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())
        );

        return createPublicUrl(key);
    }

    public String upload(byte[] content, String contentType, String extension, String directory) {
        String key = createKey(directory, extension);

        r2Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(content)
        );

        return createPublicUrl(key);
    }

    private String createKey(String directory, String extension) {
        String normalizedDirectory = directory == null
                ? ""
                : directory.replaceAll("^/+|/+$", "");
        String normalizedExtension = extension == null || extension.isBlank()
                ? ""
                : extension.startsWith(".") ? extension : "." + extension;
        String storedName = UUID.randomUUID() + normalizedExtension;

        // 파일 종류별 폴더를 사용해 채팅과 프로필 객체를 구분한다.
        return normalizedDirectory.isBlank()
                ? storedName
                : normalizedDirectory + "/" + storedName;
    }

    private String createPublicUrl(String key) {
        // 설정 URL 끝의 슬래시를 제거해 반환 URL에 이중 슬래시가 생기지 않도록 한다.
        return publicUrl.replaceAll("/+$", "") + "/" + key;
    }
}
