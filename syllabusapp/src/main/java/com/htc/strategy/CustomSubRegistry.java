/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class CustomSubRegistry {
    private final Map<String, CustomSubSectionStrategy> strategies;

    public CustomSubRegistry(List<CustomSubSectionStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(CustomSubSectionStrategy::getType, s -> s));
    }

    public CustomSubSectionStrategy get(String type) {
        return strategies.get(type);
    }
}
