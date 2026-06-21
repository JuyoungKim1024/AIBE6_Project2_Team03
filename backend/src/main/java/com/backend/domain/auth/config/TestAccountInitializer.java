package com.backend.domain.auth.config;

import com.backend.domain.user.entity.Profile;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.entity.UserRole;
import com.backend.domain.user.repository.ProfileRepository;
import com.backend.domain.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TestAccountInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String password;

    public TestAccountInitializer(
            UserRepository userRepository,
            ProfileRepository profileRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.test-accounts.enabled:false}") boolean enabled,
            @Value("${app.test-accounts.password:Test1234!}") String password
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) return;
        configure("creator12@test.com", "크리에이터12", UserRole.YOUTUBER, "크리에이터 테스트", "010-1200-0001");
        configure("editor12@test.com", "에디터12", UserRole.EDITOR, "에디터 테스트", "010-1200-0002");
    }

    private void configure(String email, String nickname, UserRole role, String name, String phone) {
        User user = userRepository.findByProviderEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseGet(() -> new User(email, passwordEncoder.encode(password), nickname));
        user.configureTestAccount(email, passwordEncoder.encode(password), nickname, role);
        userRepository.save(user);

        Profile profile = profileRepository.findByUser_Id(user.getId())
                .orElseGet(() -> new Profile(user, name, phone));
        profile.update(name, phone);
        profileRepository.save(profile);
    }
}
