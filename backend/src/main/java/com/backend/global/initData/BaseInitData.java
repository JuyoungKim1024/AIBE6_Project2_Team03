package com.backend.global.initData;

import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.repository.PostRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.util.List;

@RequiredArgsConstructor
@Configuration
public class BaseInitData {

    @Autowired
    @Lazy
    private BaseInitData self;

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Bean
    ApplicationRunner baseInitDataApplicationRunner() {
        return args -> {
            self.work1();
        };
    }

    @Transactional
    public void work1() {
        if (postRepository.count() > 0) return;

        List<User> users = userRepository.findAll();
        if (users.isEmpty()) return;

        User user = users.get(0);

        postRepository.saveAll(List.of(
                new JobPost(user, "편집 경력 3년 에디터 구직합니다", "유튜브 채널 편집 전문입니다. 장편/숏폼 모두 가능합니다.", null, 300000, 500000, true, JobPost.PostType.JOB_SEARCH),
                new JobPost(user, "브이로그 전문 편집자 구직", "감성 브이로그 편집 특기입니다. 색보정 포함 가능합니다.", null, 200000, 350000, false, JobPost.PostType.JOB_SEARCH),
                new JobPost(user, "숏폼 편집자 구인합니다", "릴스/쇼츠 전문 편집자 구합니다. 주 2회 납품 가능하신 분.", null, 300000, 500000, true, JobPost.PostType.RECRUITING),
                new CommunityPost(user, "편집 툴 추천 받아요", "프리미어 말고 다른 툴 써보신 분 있나요?", null, CommunityPost.Category.FREE),
                new CommunityPost(user, "숏폼 편집 팁 공유합니다", "제가 쓰는 숏폼 편집 워크플로우 공유해요.", null, CommunityPost.Category.INFO)
        ));
    }
}
