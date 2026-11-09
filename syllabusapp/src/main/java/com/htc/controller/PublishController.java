/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.controller;

import com.htc.service.TemplateCloneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api")
public class PublishController {

    @Autowired
    private TemplateCloneService cloneService;

    @PostMapping("/publish-template/{id}")
    public ResponseEntity<String> receivePublishRequest(@PathVariable(value = "id") Long id) {
        if (id == null || id <= 0) {
            return new ResponseEntity<>("ID Template không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        try {
            this.cloneService.cloneOutlinesToNewTemplate(id);
            return new ResponseEntity<>("Nhân bản đề cương thành công", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
