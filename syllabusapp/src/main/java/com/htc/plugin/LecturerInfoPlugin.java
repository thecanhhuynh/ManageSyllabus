/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import com.htc.pojo.SyllabusesSubsection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
@RequiredArgsConstructor
public class LecturerInfoPlugin implements SubSectionPlugin{
    @Override
    public String getPluginCode() {
        return "LECTURER_INFO";
    }

    @Override
    public SyllabusesSubsection cloneData(SyllabusesSubsection oldSub) {
        SyllabusesSubsection newSub = new SyllabusesSubsection();
        newSub.setCode(getPluginCode());
        // TODO: Logic query DB cũ và map sang data mới...
        return newSub;
    }
}
