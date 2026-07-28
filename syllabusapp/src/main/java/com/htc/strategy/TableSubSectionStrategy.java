/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesTablesubsection;
import com.htc.repository.TableSubSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
@RequiredArgsConstructor
public class TableSubSectionStrategy implements CustomSubSectionStrategy{
    
    private TableSubSectionRepository tableSubSectionRepo;
    
    
    @Override
    public String getType() {
        return "table";
    }
    

    @Override
    public void cloneData(Long oldSubId, SyllabusesSubsection savedNewSub) {
        SyllabusesTablesubsection oldTable = this.tableSubSectionRepo.findById(oldSubId).orElse(null);
        if(oldTable == null)
            return;
        SyllabusesTablesubsection newTable = new SyllabusesTablesubsection();
        newTable.setSubsectionPtrId(savedNewSub.getId());
        newTable.setData(oldTable.getData());
        this.tableSubSectionRepo.save(newTable);
    }
    
}
