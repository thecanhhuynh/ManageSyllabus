/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import com.htc.context.SyllabusCloneContext;
import com.htc.pojo.SyllabusesSyllabus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class RequirementSubjectPlugin implements ReferencePlugin{

    @Override
    public String getReferenceCode() {
        return "requirement_subject";
    }

    @Override
    public void processSpecificData(SyllabusesSyllabus oldSyllabus, SyllabusesSyllabus newSyllabus, 
                             SyllabusCloneContext context) {
        
    }
    
}
