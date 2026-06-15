package com.backend.domain.editor.controller;

import com.backend.domain.editor.dto.FeaturedEditorResponse;
import com.backend.domain.editor.service.FeaturedEditorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/editors")
@RequiredArgsConstructor
public class FeaturedEditorController {

    private final FeaturedEditorService featuredEditorService;

    // GET /api/editors/featured
    @GetMapping("/featured")
    public List<FeaturedEditorResponse> getFeaturedEditors() {
        return featuredEditorService.getFeaturedEditors();
    }
}
