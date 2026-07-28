/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesTextsubsection;
import com.htc.repository.TextSubSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
@RequiredArgsConstructor
public class TextSubSectionStrategy implements CustomSubSectionStrategy {

    private TextSubSectionRepository textSubSectionRepo;

    @Override
    public String getType() {
        return "text";
    }

    @Override
    public void cloneData(Long oldSubId, SyllabusesSubsection savedNewSub) {

        SyllabusesTextsubsection oldText = this.textSubSectionRepo.findById(oldSubId).orElse(null);
        if (oldText == null) {
            return;
        }
        SyllabusesTextsubsection newText = new SyllabusesTextsubsection();
        newText.setSubsectionPtrId(savedNewSub.getId());
        newText.setContent(oldText.getContent());
        newText.setDisplayMode(oldText.getDisplayMode());
        newText.setPlaceHolder(oldText.getPlaceHolder());

        this.textSubSectionRepo.save(newText);
    }

}
