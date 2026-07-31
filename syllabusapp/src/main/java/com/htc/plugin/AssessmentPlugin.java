/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import com.htc.context.SyllabusCloneContext;
import com.htc.pojo.SyllabusesAssessment;
import com.htc.pojo.SyllabusesCourselearningoutcome;
import com.htc.pojo.SyllabusesMethod;
import com.htc.pojo.SyllabusesMethodcourselearningoutcome;
import com.htc.pojo.SyllabusesSyllabus;
import com.htc.repository.AssessmentRepository;
import com.htc.repository.MethodCloRepository;
import com.htc.repository.MethodRepository;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class AssessmentPlugin implements ReferencePlugin{
    @Autowired
    private AssessmentRepository assessmentRepo;
    @Autowired
    private MethodRepository methodRepo;
    @Autowired
    private MethodCloRepository methodCloRepo;

    @Override
    public String getReferenceCode() {
        return "assessment_method";
    }

    @Override
    public void processSpecificData(SyllabusesSyllabus oldSyllabus, 
                                    SyllabusesSyllabus newSyllabus, 
                                    SyllabusCloneContext context) {
        
        List<SyllabusesAssessment> oldAssessments = assessmentRepo.findBySyllabusIdId(oldSyllabus.getId());

        for (SyllabusesAssessment oldAss : oldAssessments) {
            SyllabusesAssessment newAss = new SyllabusesAssessment();
            newAss.setSyllabusId(newSyllabus);
            newAss.setTypeAssessmentId(oldAss.getTypeAssessmentId());
            newAss = assessmentRepo.save(newAss);

            // QUAN TRỌNG: Lưu ánh xạ Assessment cũ -> mới vào Context
            context.addAssessmentMapping(oldAss, newAss);

            // Clone Methods và mapping CLO
            cloneMethods(oldAss, newAss, context);
        }
    }

    private void cloneMethods(SyllabusesAssessment oldAssId, SyllabusesAssessment newAss, SyllabusCloneContext context) {
        List<SyllabusesMethod> oldMethods = methodRepo.findByAssessmentIdId(oldAssId.getId());

        for (SyllabusesMethod oldMethod : oldMethods) {
            SyllabusesMethod newMethod = new SyllabusesMethod();
            newMethod.setAssessmentId(newAss);
            newMethod.setName(oldMethod.getName());
            newMethod.setTime(oldMethod.getTime());
            newMethod.setWeight(oldMethod.getWeight());
            newMethod.setCreatedDate(new Date());
            newMethod = methodRepo.save(newMethod);

            // Clone quan hệ Method - CLO dựa vào Context CLO map
            cloneMethodCloMapping(oldMethod, newMethod, context);
        }
    }

    private void cloneMethodCloMapping(SyllabusesMethod oldMethodId, SyllabusesMethod newMethodId, SyllabusCloneContext context) {
        List<SyllabusesMethodcourselearningoutcome> oldMappings = methodCloRepo.findByMethodIdId(oldMethodId.getId());
        if (!oldMappings.isEmpty()) {
            List<SyllabusesMethodcourselearningoutcome> newMappings = oldMappings.stream().map(old -> {
                var mapping = new SyllabusesMethodcourselearningoutcome();
                mapping.setMethodId(newMethodId);
                // Dùng ID của CLO mới đã được clone ở bước trước
                SyllabusesCourselearningoutcome targetClo = context.getCloIdMap().getOrDefault(old.getCloId(), old.getCloId());
                
                mapping.setCloId(targetClo);
                return mapping;
            }).collect(Collectors.toList());
            methodCloRepo.saveAll(newMappings);
        }
    }
    
}
