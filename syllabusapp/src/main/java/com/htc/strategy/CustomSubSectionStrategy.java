/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.strategy;

import com.htc.pojo.SyllabusesSubsection;

/**
 *
 * @author Admin
 */
public interface CustomSubSectionStrategy {
    String getType(); // "text", "selection", "table"
    void cloneData(Long oldSubId, SyllabusesSubsection savedNewSub);
    void initNewData(Long subId, SyllabusesSubsection newSub);
}
