package com.backend.domain.profile.controller;

import com.backend.domain.profile.dto.PublicProfileResponse;
import com.backend.domain.profile.service.PublicProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profiles")
public class PublicProfileController {

    private final PublicProfileService publicProfileService;

    public PublicProfileController(PublicProfileService publicProfileService) {
        this.publicProfileService = publicProfileService;
    }

    @GetMapping("/{userId}")
    public PublicProfileResponse getPublicProfile(@PathVariable String userId) {
        return publicProfileService.getPublicProfile(userId);
    }
}
