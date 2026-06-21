package com.backend.domain.point.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class TossPaymentsClient {

    private final RestClient restClient;
    private final String secretKey;

    public TossPaymentsClient(
            RestClient.Builder restClientBuilder,
            @Value("${toss.payments.secret-key:}") String secretKey
    ) {
        this.restClient = restClientBuilder.baseUrl("https://api.tosspayments.com").build();
        this.secretKey = secretKey;
    }

    public TossPayment confirm(String paymentKey, String orderId, int amount) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("토스페이먼츠 시크릿 키가 설정되지 않았습니다.");
        }

        String credentials = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        try {
            TossPayment payment = restClient.post()
                    .uri("/v1/payments/confirm")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "paymentKey", paymentKey,
                            "orderId", orderId,
                            "amount", amount
                    ))
                    .retrieve()
                    .body(TossPayment.class);

            if (payment == null) {
                throw new IllegalStateException("결제 승인 결과를 확인할 수 없습니다.");
            }
            return payment;
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException("토스페이먼츠 결제 승인에 실패했습니다.");
        }
    }

    public record TossPayment(
            String paymentKey,
            String orderId,
            int totalAmount,
            String status
    ) {
    }
}
