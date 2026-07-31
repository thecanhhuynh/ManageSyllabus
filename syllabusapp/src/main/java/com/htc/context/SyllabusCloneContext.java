/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.context;

import com.htc.pojo.SyllabusesAssessment;
import com.htc.pojo.SyllabusesCourselearningoutcome;
import java.util.HashMap;
import java.util.Map;
import lombok.Getter;

/**
 *
 * @author Admin
 */
public class SyllabusCloneContext {
    private final Map<SyllabusesCourselearningoutcome, SyllabusesCourselearningoutcome> cloIdMap = new HashMap<>();
    
    // Ánh xạ ID từ đề cương cũ sang mới cho Assessment
    private final Map<SyllabusesAssessment, SyllabusesAssessment> assessmentIdMap = new HashMap<>();

    public void addCloMapping(SyllabusesCourselearningoutcome oldId, SyllabusesCourselearningoutcome newId) {
        getCloIdMap().put(oldId, newId);
    }

    public void addAssessmentMapping(SyllabusesAssessment oldId, SyllabusesAssessment newId) {
        getAssessmentIdMap().put(oldId, newId);
    }

    /**
     * @return the cloIdMap
     */
    public Map<SyllabusesCourselearningoutcome, SyllabusesCourselearningoutcome> getCloIdMap() {
        return cloIdMap;
    }

    /**
     * @return the assessmentIdMap
     */
    public Map<SyllabusesAssessment, SyllabusesAssessment> getAssessmentIdMap() {
        return assessmentIdMap;
    }
}
