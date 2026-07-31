/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import com.htc.context.SyllabusCloneContext;
import com.htc.pojo.SyllabusesSyllabus;
import com.htc.pojo.SyllabusesTeachingsession;
import com.htc.pojo.SyllabusesTeachingsessionassessment;
import com.htc.pojo.SyllabusesTeachingsessioncourselearningoutcome;
import com.htc.pojo.SyllabusesTeachingsessionlearningmaterial;
import com.htc.repository.SessionAssessmentRepository;
import com.htc.repository.SessionCloRepository;
import com.htc.repository.SessionMaterialRepository;
import com.htc.repository.TeachingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class TeachingSessionPlugin implements ReferencePlugin {
    @Autowired
    private TeachingSessionRepository sessionRepo;
    @Autowired
    private SessionCloRepository sessionCloRepo;
    @Autowired
    private SessionAssessmentRepository sessionAssessmentRepo;
    @Autowired
    private SessionMaterialRepository sessionMaterialRepo;

    @Override
    public String getReferenceCode() {
        return "teaching_schedule";
    }

    @Override
    public void processSpecificData(SyllabusesSyllabus oldSyllabus, 
                                    SyllabusesSyllabus newSyllabus, 
                                    SyllabusCloneContext context) {
        
        List<SyllabusesTeachingsession> oldSessions = sessionRepo.findBySyllabusId(oldSyllabus);

        for (SyllabusesTeachingsession oldSession : oldSessions) {
            SyllabusesTeachingsession newSession = new SyllabusesTeachingsession();
            newSession.setSyllabusId(newSyllabus);
            newSession.setScheduleGroupId(oldSession.getScheduleGroupId());
            newSession.setSessionNo(oldSession.getSessionNo());
            newSession.setContent(oldSession.getContent());
            newSession.setOfflineActivity(oldSession.getOfflineActivity());
            newSession.setOfflineHours(oldSession.getOfflineHours());
            newSession.setOnlineActivity(oldSession.getOnlineActivity());
            newSession.setOnlineHours(oldSession.getOnlineHours());
            newSession.setSelfStudyActivity(oldSession.getSelfStudyActivity());
            newSession.setSelfStudyHours(oldSession.getSelfStudyHours());
            
            newSession = sessionRepo.save(newSession);

            // Clone 3 bảng trung gian dựa vào các Map ánh xạ trong Context
            cloneSessionCLOs(oldSession, newSession, context);
            cloneSessionAssessments(oldSession, newSession, context);
            cloneSessionMaterials(oldSession, newSession);
        }
    }

    private void cloneSessionCLOs(SyllabusesTeachingsession oldSessionId, 
            SyllabusesTeachingsession newSessionId, SyllabusCloneContext context) {
        List<SyllabusesTeachingsessioncourselearningoutcome> oldList = sessionCloRepo.findByTeachingSessionId(oldSessionId);
        if (!oldList.isEmpty()) {
            var newList = oldList.stream().map(old -> {
                var obj = new SyllabusesTeachingsessioncourselearningoutcome();
                obj.setTeachingSessionId(newSessionId);
                obj.setCloId(context.getCloIdMap().getOrDefault(old.getCloId(), old.getCloId()));
                return obj;
            }).collect(Collectors.toList());
            sessionCloRepo.saveAll(newList);
        }
    }

    private void cloneSessionAssessments(SyllabusesTeachingsession oldSessionId, SyllabusesTeachingsession newSessionId, SyllabusCloneContext context) {
        List<SyllabusesTeachingsessionassessment> oldList = sessionAssessmentRepo.findByTeachingSessionId(oldSessionId);
        if (!oldList.isEmpty()) {
            var newList = oldList.stream().map(old -> {
                var obj = new SyllabusesTeachingsessionassessment();
                obj.setTeachingSessionId(newSessionId);
                obj.setAssessmentId(context.getAssessmentIdMap().getOrDefault(old.getAssessmentId(), old.getAssessmentId()));
                return obj;
            }).collect(Collectors.toList());
            sessionAssessmentRepo.saveAll(newList);
        }
    }

    private void cloneSessionMaterials(SyllabusesTeachingsession oldSessionId, SyllabusesTeachingsession newSessionId) {
        List<SyllabusesTeachingsessionlearningmaterial> oldList = sessionMaterialRepo.findByTeachingSessionId(oldSessionId);
        if (!oldList.isEmpty()) {
            var newList = oldList.stream().map(old -> {
                var obj = new SyllabusesTeachingsessionlearningmaterial();
                obj.setTeachingSessionId(newSessionId);
                obj.setLearningMaterialId(old.getLearningMaterialId());
                return obj;
            }).collect(Collectors.toList());
            sessionMaterialRepo.saveAll(newList);
        }
    }
}
