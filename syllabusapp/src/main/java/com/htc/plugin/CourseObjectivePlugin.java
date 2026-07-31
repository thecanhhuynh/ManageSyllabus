/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import com.htc.context.SyllabusCloneContext;
import com.htc.pojo.SyllabusesCloploassociation;
import com.htc.pojo.SyllabusesCourselearningoutcome;
import com.htc.pojo.SyllabusesCourseobjective;
import com.htc.pojo.SyllabusesCourseobjectiveprogrammelearningoutcome;
import com.htc.pojo.SyllabusesSyllabus;
import com.htc.repository.CloPloRepo;
import com.htc.repository.CourseLearningOutcomeRepository;
import com.htc.repository.CourseObjectiveAndProgrammeLearningOutcomeRepository;
import com.htc.repository.CourseObjectiveRepository;
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
public class CourseObjectivePlugin implements ReferencePlugin {
    @Autowired
    private CourseObjectiveRepository coRepo;
    @Autowired
    private CourseLearningOutcomeRepository cloRepo;
    @Autowired
    private CourseObjectiveAndProgrammeLearningOutcomeRepository coPloRepo;
    @Autowired
    private CloPloRepo cloPloRepo;
    
    @Override
    public String getReferenceCode() {
        return "objective_outcomes";
    }

    @Override
    public void processSpecificData(SyllabusesSyllabus oldSyllabus, SyllabusesSyllabus newSyllabus, 
                             SyllabusCloneContext context) {
    // Lấy danh sách CO theo đề cương cũ
        List<SyllabusesCourseobjective> oldCOs = coRepo.findBySyllabusIdId(oldSyllabus.getId());

        for (SyllabusesCourseobjective oldCO : oldCOs) {
            // 1. Clone CO và gắn vào đề cương mới
            SyllabusesCourseobjective newCO = new SyllabusesCourseobjective();
            newCO.setSyllabusId(newSyllabus);
            newCO.setContent(oldCO.getContent());
            newCO.setPosition(oldCO.getPosition());
            newCO = coRepo.save(newCO);

            // 2. Clone quan hệ CO - PLO
            cloneCoPloMapping(oldCO, newCO);

            // 3. Clone CLO (chuẩn đầu ra môn học) thuộc về CO này
            cloneCLOs(oldCO, newCO, context);
        }
    }
    
    private void cloneCoPloMapping(SyllabusesCourseobjective oldCo, SyllabusesCourseobjective newCo) {
        List<SyllabusesCourseobjectiveprogrammelearningoutcome> oldMappings = coPloRepo.findByCourseObjectiveIdId(oldCo.getId());
        if (!oldMappings.isEmpty()) {
            List<SyllabusesCourseobjectiveprogrammelearningoutcome> newMappings = oldMappings.stream().map(old -> {
                SyllabusesCourseobjectiveprogrammelearningoutcome mapping = new SyllabusesCourseobjectiveprogrammelearningoutcome();
                mapping.setCourseObjectiveId(newCo);
                mapping.setProgrammeLearningOutcomeId(old.getProgrammeLearningOutcomeId());
                return mapping;
            }).collect(Collectors.toList());
            coPloRepo.saveAll(newMappings);
        }
    }

    private void cloneCLOs(SyllabusesCourseobjective oldCo, SyllabusesCourseobjective newCo,
            SyllabusCloneContext context) {
        List<SyllabusesCourselearningoutcome> oldCLOs = cloRepo.findByCourseObjectiveIdId(oldCo.getId());
        
        for (SyllabusesCourselearningoutcome oldCLO : oldCLOs) {
            // Clone CLO và gắn vào CO mới
            SyllabusesCourselearningoutcome newCLO = new SyllabusesCourselearningoutcome();
            newCLO.setCourseObjectiveId(newCo);
            newCLO.setContent(oldCLO.getContent());
            newCLO.setPosition(oldCLO.getPosition());
            newCLO = cloRepo.save(newCLO);
            context.addCloMapping(oldCLO, newCLO);

            // Clone quan hệ CLO - PLO
            cloneCloPloMapping(oldCLO, newCLO);
        }
    }

    private void cloneCloPloMapping(SyllabusesCourselearningoutcome oldClo, SyllabusesCourselearningoutcome newClo) {
        List<SyllabusesCloploassociation> oldMappings = cloPloRepo.findByCloIdId(oldClo.getId());
        if (!oldMappings.isEmpty()) {
            List<SyllabusesCloploassociation> newMappings = oldMappings.stream().map(old -> {
                SyllabusesCloploassociation mapping = new SyllabusesCloploassociation();
                mapping.setCloId(newClo);
                mapping.setPloId(old.getPloId());
                mapping.setRating(old.getRating());
                return mapping;
            }).collect(Collectors.toList());
            cloPloRepo.saveAll(newMappings);
        }
    }

}
