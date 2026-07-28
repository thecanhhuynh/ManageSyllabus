/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PublishController {

    @PostMapping("/publish-template")
    public ResponseEntity<String> receivePublishRequest(@RequestBody Map<String, Object> payload) {
        System.out.println("Nhận được tín hiệu ban hành: " + payload);
        return ResponseEntity.accepted().body("Đang xử lý ban hành đề cương...");
    }
}
