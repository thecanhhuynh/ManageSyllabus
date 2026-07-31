/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import com.htc.context.SyllabusCloneContext;
import com.htc.pojo.SyllabusesSyllabus;
import com.htc.pojo.SyllabusesSyllabuslearningmaterial;
import com.htc.repository.SyllabusLearningMaterialRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class LearningMaterialPlugin implements ReferencePlugin {
    @Autowired
    private SyllabusLearningMaterialRepository syllabusMaterialRepo;

    @Override
    public String getReferenceCode() {
        return "learning_material";
    }

    @Override
    public void processSpecificData(SyllabusesSyllabus oldSyllabus, SyllabusesSyllabus newSyllabus, 
                             SyllabusCloneContext context) {
        List<SyllabusesSyllabuslearningmaterial> oldMaterials = syllabusMaterialRepo.findBySyllabusId(oldSyllabus);
        
        if (oldMaterials == null || oldMaterials.isEmpty()) {
            return;
        }
        
        List<SyllabusesSyllabuslearningmaterial> newMaterials = new ArrayList<>();
        
        for (SyllabusesSyllabuslearningmaterial oldItem : oldMaterials) {
            SyllabusesSyllabuslearningmaterial newItem = new SyllabusesSyllabuslearningmaterial();
            
            newItem.setSyllabusId(newSyllabus); 
            newItem.setLearningMaterialId(oldItem.getLearningMaterialId()); 
            newItem.setTypeMaterialId(oldItem.getTypeMaterialId());
            
            newMaterials.add(newItem);
        }

        syllabusMaterialRepo.saveAll(newMaterials);
    }

}
