/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.service;

import com.htc.plugin.PluginRegistry;
import com.htc.plugin.SubSectionPlugin;
import com.htc.pojo.SyllabusesMainsection;
import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesSyllabus;
import com.htc.pojo.SyllabusesTemplatemainsection;
import com.htc.pojo.SyllabusesTemplatesubsection;
import com.htc.pojo.SyllabusesTemplatesyllabus;
import com.htc.repository.MainSectionRepository;
import com.htc.repository.SubSectionRepository;
import com.htc.repository.SyllabusRepository;
import com.htc.repository.TemplateMainSectionRepository;
import com.htc.repository.TemplateSubSectionRepository;
import com.htc.repository.TemplateSyllabusRepository;
import com.htc.strategy.CustomSubRegistry;
import com.htc.strategy.CustomSubSectionStrategy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author Admin
 */
@Service
@RequiredArgsConstructor
public class TemplateCloneService {

    private final TemplateMainSectionRepository templateMainRepo;
    private final SyllabusRepository syllabusRepo;
    private final TemplateSyllabusRepository templateRepo;
    private final TemplateSubSectionRepository templateSubRepo;
    private final SubSectionRepository subSectionRepo;
    private final MainSectionRepository mainSectionRepo;
    private final CustomSubRegistry customSubRegistry;
    private final PluginRegistry pluginRegistry;

    @Transactional
    public void cloneOutlinesToNewTemplate(long templateId) {
        SyllabusesTemplatesyllabus currentTemplate = this.templateRepo.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Template hiện tại"));
        SyllabusesTemplatesyllabus oldTemplate = this.templateRepo.findById(currentTemplate.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Template cũ"));

        List<SyllabusesTemplatemainsection> newTemplateSections = this.templateMainRepo.findByTemplateIdOrderByPositionAsc(currentTemplate.getId());

        Map<String, Integer> newMainMap = new HashMap<>();
        Map<String, Map<String, Integer>> newSubMap = new HashMap<>();

        for (SyllabusesTemplatemainsection section : newTemplateSections) {
            newMainMap.put(section.getCode(), section.getPosition());

            // Lấy và map danh sách SubSection của Template mới
            List<SyllabusesTemplatesubsection> newSubs = this.templateSubRepo.findByMainSectionId(section.getId());
            Map<String, Integer> subPositions = new HashMap<>();
            for (SyllabusesTemplatesubsection sub : newSubs) {
                subPositions.put(sub.getCode(), sub.getPosition());
            }
            newSubMap.put(section.getCode(), subPositions);
        }

        List<SyllabusesSyllabus> syllabuses = this.syllabusRepo.findByTemplateId(oldTemplate.getId());
        List<SyllabusesSyllabus> clonedSyllabuses = new ArrayList<>();
        List<SyllabusesMainsection> clonedSections = new ArrayList<>();
        List<SyllabusesSubsection> clonedSubSections = new ArrayList<>();

        for (SyllabusesSyllabus oldSyllabus : syllabuses) {
            // 1. Clone Vỏ Syllabus
            SyllabusesSyllabus newSyllabus = new SyllabusesSyllabus();
            // TODO: Copy properties cơ bản từ oldSyllabus (name, version...)
            String name = oldSyllabus.getName() + currentTemplate.getVersion();
            newSyllabus.setName(name);
            newSyllabus.setTemplateId(currentTemplate);
            clonedSyllabuses.add(newSyllabus);

            // 2. Clone MainSection
            List<SyllabusesMainsection> oldSections = this.mainSectionRepo.findBySyllabusId(oldSyllabus.getId());
            for (SyllabusesMainsection oldSec : oldSections) {
                if (newMainMap.containsKey(oldSec.getCode())) {
                    SyllabusesMainsection newSec = new SyllabusesMainsection();
                    newSec.setCode(oldSec.getCode());
                    newSec.setPosition(newMainMap.get(oldSec.getCode()));
                    newSec.setSyllabusId(newSyllabus);
                    clonedSections.add(newSec);

                    // 3. Clone SubSection
                    List<SyllabusesSubsection> oldSubs = this.subSectionRepo.findByMainSectionId(oldSec.getId());
                    Map<String, Integer> currentSubMap = newSubMap.getOrDefault(oldSec.getCode(), Collections.emptyMap());

                    for (SyllabusesSubsection oldSub : oldSubs) {
                        String type = oldSub.getType();
                        boolean isCustom = List.of("text", "selection", "table").contains(type);

                        if (isCustom || currentSubMap.containsKey(oldSub.getCode())) {
                            SyllabusesSubsection newSub = new SyllabusesSubsection();
                            newSub.setCode(oldSub.getCode());
                            newSub.setType(type);
                            newSub.setMainSectionId(newSec);
                            newSub.setPosition(isCustom ? oldSub.getPosition() : currentSubMap.get(oldSub.getCode()));

                            newSub = subSectionRepo.save(newSub);

                            if (isCustom) {
                                CustomSubSectionStrategy strategy = customSubRegistry.get(type);
                                if (strategy != null) {
                                    strategy.cloneData(oldSub.getId(), newSub);
                                }
                            } else {
//                                SubSectionPlugin plugin = pluginRegistry.get(oldSub.getCode());
//                                if (plugin != null) {
//                                    plugin.cloneData(oldSub.getId(), newSub);
//                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
