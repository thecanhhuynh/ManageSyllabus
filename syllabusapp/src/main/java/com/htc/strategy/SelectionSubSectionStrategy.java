/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesAttributegroup;
import com.htc.pojo.SyllabusesSelectionsubsection;
import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesSubsectionattributevalue;
import com.htc.pojo.SyllabusesTemplateselectionsubsection;
import com.htc.repository.AttributeGroupRepository;
import com.htc.repository.SelectionSubSectionRepository;
import com.htc.repository.SubSectionAttributeValueRepository;
import com.htc.repository.TemplateSelectionRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class SelectionSubSectionStrategy implements CustomSubSectionStrategy {

    @Autowired
    private SelectionSubSectionRepository selectionSubSectionRepo;
    @Autowired
    private SubSectionAttributeValueRepository subSectionAttributeValueRepo;
    @Autowired
    private TemplateSelectionRepository templateSelectionRepo;
    @Autowired
    private AttributeGroupRepository attributeGroupRepo;

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

        if (oldRelations != null && !oldRelations.isEmpty()) {
            List<SyllabusesSubsectionattributevalue> newRelations = new ArrayList<>();

            for (SyllabusesSubsectionattributevalue oldRel : oldRelations) {
                SyllabusesSubsectionattributevalue newRel = new SyllabusesSubsectionattributevalue();
                newRel.setAttributeValueId(oldRel.getAttributeValueId());
                newRel.setSubsectionId(newSelec);
                newRelations.add(newRel);
            }

            this.subSectionAttributeValueRepo.saveAll(newRelations);

        }
    }

    @Override
    public void initNewData(Long subId, SyllabusesSubsection newSub) {
        SyllabusesTemplateselectionsubsection tplSelection = templateSelectionRepo.findById(subId).orElse(null);
        if (tplSelection != null) {
            SyllabusesSelectionsubsection selectionSub = new SyllabusesSelectionsubsection();
            selectionSub.setSubsectionPtrId(newSub.getId());

            if (tplSelection.getAttributeGroupId() != null) {
                Long groupIdLong = tplSelection.getAttributeGroupId().longValue();
                SyllabusesAttributegroup attributeGroup = this.attributeGroupRepo.findById(groupIdLong).orElse(null);
                selectionSub.setAttributeGroupId(attributeGroup);
            }
            this.selectionSubSectionRepo.save(selectionSub);
        }
    }

}
