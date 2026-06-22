package com.backend.domain.editor.controller;

import com.backend.domain.editor.service.R2UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final R2UploadService r2UploadService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        // 파일은 서버 로컬 디스크가 아닌 R2에 저장하고, 기존 프론트엔드와 호환되도록 url 응답 형식을 유지한다.
        return ResponseEntity.ok(Map.of("url", r2UploadService.upload(file)));
    }
}
