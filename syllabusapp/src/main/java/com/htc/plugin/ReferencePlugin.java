/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import com.htc.context.SyllabusCloneContext;
import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesSyllabus;

/**
 *
 * @author Admin
 */
public interface ReferencePlugin {
    String getReferenceCode();
    public void processSpecificData(SyllabusesSyllabus oldSyllabus, SyllabusesSyllabus newSyllabus, 
                             SyllabusCloneContext context);
}
