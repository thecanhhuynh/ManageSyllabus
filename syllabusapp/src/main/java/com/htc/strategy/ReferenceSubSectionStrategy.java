/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesSubsection;
import com.htc.repository.ReferenceSubSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class ReferenceSubSectionStrategy implements CustomSubSectionStrategy{
    @Autowired
    private ReferenceSubSectionRepository refRepo;
    
    @Override
    public String getType() {
        return "reference";
    }

    @Override
    public void cloneData(Long oldSubId, SyllabusesSubsection savedNewSub, Long oldSyllabusId, Long newSyllabusId) {
    }
    
}
