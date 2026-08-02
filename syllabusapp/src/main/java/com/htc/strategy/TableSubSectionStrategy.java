/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesTablesubsection;
import com.htc.pojo.SyllabusesTemplatetablesubsection;
import com.htc.repository.TableSubSectionRepository;
import com.htc.repository.TemplateTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class TableSubSectionStrategy implements CustomSubSectionStrategy {

    @Autowired
    private TableSubSectionRepository tableSubSectionRepo;
    @Autowired
    private TemplateTableRepository templateTableRepo;

    @Override
    public String getType() {
        return "table";
    }

    @Override
    public void cloneData(Long oldSubId, SyllabusesSubsection savedNewSub) {
        SyllabusesTablesubsection oldTable = this.tableSubSectionRepo.findById(oldSubId).orElse(null);
        if (oldTable == null) {
            return;
        }
        SyllabusesTablesubsection newTable = new SyllabusesTablesubsection();
        newTable.setSubsectionPtrId(savedNewSub.getId());
        newTable.setData(oldTable.getData());
        this.tableSubSectionRepo.save(newTable);
    }

    @Override
    public void initNewData(Long subId, SyllabusesSubsection newSub) {
        SyllabusesTemplatetablesubsection subTable = this.templateTableRepo.findById(subId).orElse(null);
        if (subTable != null) {
            SyllabusesTablesubsection tableSub = new SyllabusesTablesubsection();
            tableSub.setSubsectionPtrId(newSub.getId());
            tableSub.setData(subTable.getTableSchema());
            tableSubSectionRepo.save(tableSub);
        }

    }

}
