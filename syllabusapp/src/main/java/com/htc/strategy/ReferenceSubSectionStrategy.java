/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesReferencesubsection;
import com.htc.pojo.SyllabusesSubsection;
import com.htc.repository.ReferenceSubSectionRepository;
import com.htc.repository.TemplateReferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class ReferenceSubSectionStrategy implements CustomSubSectionStrategy {

    @Autowired
    private ReferenceSubSectionRepository refRepo;

    @Override
    public String getType() {
        return "reference";
    }

    @Override
    public void cloneData(Long oldSubId, SyllabusesSubsection savedNewSub) {
        SyllabusesReferencesubsection oldRef = refRepo.findById(oldSubId).orElse(null);
        SyllabusesReferencesubsection newRef = new SyllabusesReferencesubsection();

        newRef.setSubsectionPtrId(savedNewSub.getId());

        if (oldRef != null && oldRef.getReferenceCode() != null) {
            newRef.setReferenceCode(oldRef.getReferenceCode());
        } else {
            newRef.setReferenceCode(savedNewSub.getCode());
        }

        refRepo.save(newRef);
    }

    @Override
    public void initNewData(Long templateSubId, SyllabusesSubsection newSub) {
        SyllabusesReferencesubsection newRef = new SyllabusesReferencesubsection();

        newRef.setSubsectionPtrId(newSub.getId());
        newRef.setReferenceCode(newSub.getCode());

        refRepo.save(newRef);
    }

}
