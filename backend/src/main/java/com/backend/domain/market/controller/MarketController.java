package com.backend.domain.market.controller;

import com.backend.domain.market.dto.MarketPriceResponse;
import com.backend.domain.market.service.MarketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketService marketService;

    // GET /api/market/prices
    @GetMapping("/prices")
    public List<MarketPriceResponse> getMarketPrices() {
        return marketService.getMarketPrices();
    }
}
