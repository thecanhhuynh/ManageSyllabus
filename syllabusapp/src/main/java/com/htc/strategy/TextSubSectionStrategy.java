/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesTemplatetextsubsection;
import com.htc.pojo.SyllabusesTextsubsection;
import com.htc.repository.TemplateTextRepository;
import com.htc.repository.TextSubSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class TextSubSectionStrategy implements CustomSubSectionStrategy {

    @Autowired
    private TextSubSectionRepository textSubSectionRepo;
    
    @Autowired
    private TemplateTextRepository templateTextRepo;

    @Override
    public String getType() {
        return "text";
    }

    @Override
    public void cloneData(Long oldSubId, SyllabusesSubsection savedNewSub) {

        SyllabusesTextsubsection oldText = this.textSubSectionRepo.findById(oldSubId)
            .orElseThrow(() -> new RuntimeException(
                "Lỗi Clone Data: Không tìm thấy bản ghi SyllabusesTextsubsection với ID = [" + oldSubId + "]"
            ));
        SyllabusesTextsubsection newText = new SyllabusesTextsubsection();
        newText.setSubsectionPtrId(savedNewSub.getId());
        newText.setContent(oldText.getContent());
        newText.setDisplayMode(oldText.getDisplayMode());
        newText.setPlaceHolder(oldText.getPlaceHolder());

        this.textSubSectionRepo.save(newText);
    }

    @Override
    public void initNewData(Long subId, SyllabusesSubsection newSub) {
        SyllabusesTemplatetextsubsection subText = this.templateTextRepo.findById(subId).orElse(null);
        if (subText != null) {
            SyllabusesTextsubsection textSub = new SyllabusesTextsubsection();
            textSub.setSubsectionPtrId(newSub.getId()); // Dùng chung ID (cơ chế kế thừa)
            textSub.setContent(""); // Dữ liệu rỗng
            textSub.setDisplayMode(subText.getDisplayMode());
            textSub.setPlaceHolder(subText.getPlaceHolder());
            this.textSubSectionRepo.save(textSub);
        }
    }

}
