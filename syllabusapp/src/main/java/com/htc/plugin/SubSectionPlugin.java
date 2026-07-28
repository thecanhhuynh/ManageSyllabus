/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import com.htc.pojo.SyllabusesSubsection;

/**
 *
 * @author Admin
 */
public interface SubSectionPlugin {
    String getPluginCode();
    SyllabusesSubsection cloneData(SyllabusesSubsection oldSub);
}
