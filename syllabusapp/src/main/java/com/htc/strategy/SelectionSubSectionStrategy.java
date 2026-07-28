/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesSelectionsubsection;
import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesSubsectionattributevalue;
import com.htc.repository.SelectionSubSectionRepository;
import com.htc.repository.SubSectionAttributeValueRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
@RequiredArgsConstructor
public class SelectionSubSectionStrategy implements CustomSubSectionStrategy {

    private SelectionSubSectionRepository selectionSubSectionRepo;
    private SubSectionAttributeValueRepository subSectionAttributeValueRepo;
    
    
    @Override
    public String getType() {
        return "selection";
    }

    @Override
    public void cloneData(Long oldSubId, SyllabusesSubsection savedNewSub) {
        SyllabusesSelectionsubsection oldSelec = this.selectionSubSectionRepo.findById(oldSubId).orElse(null);
        if (oldSelec == null) {
            return;
        }
        SyllabusesSelectionsubsection newSelec = new SyllabusesSelectionsubsection();
        newSelec.setSubsectionPtrId(savedNewSub.getId());
        newSelec.setAttributeGroupId(oldSelec.getAttributeGroupId());

        newSelec = this.selectionSubSectionRepo.save(newSelec);
        List<SyllabusesSubsectionattributevalue> oldRelations = this.subSectionAttributeValueRepo.findBySubsectionId(oldSelec);

        if(oldRelations != null && !oldRelations.isEmpty()){
            List<SyllabusesSubsectionattributevalue> newRelations = new ArrayList<>();
            
            for(SyllabusesSubsectionattributevalue oldRel : oldRelations){
                SyllabusesSubsectionattributevalue newRel = new SyllabusesSubsectionattributevalue();
                newRel.setAttributeValueId(oldRel.getAttributeValueId());
                newRel.setSubsectionId(newSelec);
                newRelations.add(newRel);
            }
            
            this.subSectionAttributeValueRepo.saveAll(newRelations);
                    
        }
    }

}
