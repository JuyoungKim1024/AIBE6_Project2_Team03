package com.backend.domain.dispute.service;

import com.backend.domain.chat.entity.ChatMessage;
import com.backend.domain.chat.repository.ChatMessageRepository;
import com.backend.domain.dispute.entity.Dispute;
import com.backend.domain.dispute.repository.DisputeRepository;
import com.backend.domain.project.entity.Project;
import com.backend.global.ai.GeminiClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

import static java.util.stream.Collectors.joining;

@Slf4j
@Service
@RequiredArgsConstructor
public class DisputeJudgeService {

    private final DisputeRepository disputeRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("MM/dd HH:mm");
    private static final int MAX_MESSAGES = 100;

    @Async("disputeJudgeExecutor")
    @Transactional
    public void judgeAsync(String disputeId) {
        Dispute dispute = disputeRepository.findByIdWithDetails(disputeId).orElse(null);
        if (dispute == null) {
            log.error("judgeAsync: dispute를 찾을 수 없습니다. disputeId={}", disputeId);
            return;
        }

        try {
            Project project = dispute.getProject();
            String chatHistory = buildChatHistory(project.getRoom().getId());
            String prompt = buildPrompt(dispute, project, chatHistory);

            String raw = geminiClient.generate(prompt);
            String cleaned = raw.replaceAll("```json\\n?|\\n?```", "").trim();

            JsonNode node = objectMapper.readTree(cleaned);
            int finalAmount = node.path("adjustedAmount").asInt(-1);
            if (finalAmount < 0) {
                throw new IllegalStateException("AI 응답에 adjustedAmount 필드가 없습니다.");
            }

            dispute.applyJudgment(cleaned, finalAmount);
        } catch (Exception e) {
            log.error("AI 분쟁 판정 실패 disputeId={}", disputeId, e);
            dispute.markFailed();
        }
    }

    private String buildChatHistory(String roomId) {
        List<ChatMessage> messages = chatMessageRepository.findByChatRoom_IdOrderByCreatedAtAsc(roomId);
        if (messages.size() > MAX_MESSAGES) {
            messages = messages.subList(messages.size() - MAX_MESSAGES, messages.size());
        }
        return messages.stream()
                .map(m -> String.format("[%s] %s: %s",
                        m.getCreatedAt().format(FORMATTER),
                        m.getSender().getNickname(),
                        m.getContent()))
                .collect(joining("\n"));
    }

    private String buildPrompt(Dispute dispute, Project project, String chatHistory) {
        return String.format("""
당신은 프리랜서 플랫폼의 공정한 AI 분쟁 조정관입니다.
아래 프로젝트 정보와 채팅 이력을 분석하여 분쟁을 판정하세요.

[프로젝트 명세]
분야: %s
합의 금액: %s원
영상 길이: %s분
수정 허용 횟수: %d회
마감일: %s
메모: %s

[분쟁 유형] %s
[신고 내용] %s

[채팅 이력]
%s

반드시 아래 JSON 형식으로만 응답하세요. 코드블록 없이 순수 JSON만:
{
  "summary": "분쟁 핵심 요약 (2~3문장)",
  "editorFaultReasons": ["에디터 귀책 사유 목록, 없으면 빈 배열"],
  "requesterFaultReasons": ["크리에이터 귀책 사유 목록, 없으면 빈 배열"],
  "adjustedAmount": 정산 금액 (정수, 원 단위),
  "adjustmentReason": "금액 산정 근거",
  "recommendation": "양측에 대한 권고 메시지"
}
""",
                project.getField() != null ? project.getField() : "미지정",
                project.getPrice() != null ? project.getPrice() : "미지정",
                project.getVideoLength() != null ? project.getVideoLength() : "미지정",
                project.getRevisionCount(),
                project.getDeadline() != null ? project.getDeadline().format(FORMATTER) : "미지정",
                project.getMemo() != null ? project.getMemo() : "없음",
                dispute.getType().name(),
                dispute.getDescription(),
                chatHistory
        );
    }
}
