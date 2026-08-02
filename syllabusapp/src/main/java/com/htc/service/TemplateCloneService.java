/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.service;

import com.htc.context.SyllabusCloneContext;
import com.htc.plugin.ReferencePlugin;
import com.htc.plugin.ReferencePluginRegistry;
import com.htc.pojo.SyllabusesMainsection;
import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesSyllabus;
import com.htc.pojo.SyllabusesTemplatemainsection;
import com.htc.pojo.SyllabusesTemplatesubsection;
import com.htc.pojo.SyllabusesTemplatesyllabus;
import com.htc.repository.MainSectionRepository;
import com.htc.repository.ReferenceSubSectionRepository;
import com.htc.repository.SelectionSubSectionRepository;
import com.htc.repository.SubSectionRepository;
import com.htc.repository.SyllabusRepository;
import com.htc.repository.TableSubSectionRepository;
import com.htc.repository.TemplateMainSectionRepository;
import com.htc.repository.TemplateSubSectionRepository;
import com.htc.repository.TemplateSyllabusRepository;
import com.htc.repository.TextSubSectionRepository;
import com.htc.strategy.CustomSubRegistry;
import com.htc.strategy.CustomSubSectionStrategy;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author Admin
 */
@Service
public class TemplateCloneService {

    @Autowired
    private TemplateMainSectionRepository templateMainRepo;
    @Autowired
    private SyllabusRepository syllabusRepo;
    @Autowired
    private TemplateSyllabusRepository templateRepo;
    @Autowired
    private TemplateSubSectionRepository templateSubRepo;
    @Autowired
    private SubSectionRepository subSectionRepo;
    @Autowired
    private MainSectionRepository mainSectionRepo;
    @Autowired
    private CustomSubRegistry customSubRegistry;
    @Autowired
    private ReferencePluginRegistry pluginRegistry;
    @Autowired
    private TextSubSectionRepository textSubSectionRepo;
    @Autowired
    private SelectionSubSectionRepository selectionSubSectionRepo;
    @Autowired
    private TableSubSectionRepository tableSubSectionRepo;
    @Autowired
    private ReferenceSubSectionRepository referenceSubSectionRepo;
    

    @Transactional
    public void cloneOutlinesToNewTemplate(long templateId) {
        SyllabusCloneContext context = new SyllabusCloneContext();
        SyllabusesTemplatesyllabus currentTemplate = this.templateRepo.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Template hiện tại"));
        SyllabusesTemplatesyllabus oldTemplate = this.templateRepo.findById(currentTemplate.getParentId().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Template cũ"));

        List<SyllabusesTemplatemainsection> newTemplateSections = this.templateMainRepo.findByTemplateIdOrderByPositionAsc(currentTemplate);
        List<SyllabusesSyllabus> syllabuses = this.syllabusRepo.findByTemplateId(oldTemplate);

        for (SyllabusesSyllabus oldSyllabus : syllabuses) {
            SyllabusesSyllabus newSyllabus = new SyllabusesSyllabus();
            newSyllabus.setName(oldSyllabus.getName() + " - " + currentTemplate.getVersion());
            newSyllabus.setCreatedDate(new Date());
            newSyllabus.setStartDateEdition(new Date());
            newSyllabus.setEndDateEdition(new Date());
            newSyllabus.setEditDate("Ban hành mẫu mới");
            newSyllabus.setStatus("Active");
            newSyllabus.setTemplateId(currentTemplate);
            newSyllabus.setSubjectId(oldSyllabus.getSubjectId());
            newSyllabus.setLecturerId(oldSyllabus.getLecturerId());
            newSyllabus.setFacultyId(oldSyllabus.getFacultyId());
            newSyllabus.setVersion(oldSyllabus.getVersion() + "_new");
            newSyllabus = this.syllabusRepo.save(newSyllabus);

            List<SyllabusesMainsection> oldSections = this.mainSectionRepo.findBySyllabusId(oldSyllabus);
            Map<String, SyllabusesMainsection> oldSecMap = new HashMap<>();
            for (SyllabusesMainsection oldSec : oldSections) {
                oldSecMap.put(oldSec.getCode(), oldSec);
            }

            // --- BƯỚC 1: KHỞI TẠO BỘ ĐẾM KỲ VỌNG TỪ TEMPLATE MỚI ---
            Map<String, Integer> expectedTypeCounts = new HashMap<>();
            expectedTypeCounts.put("text", 0);
            expectedTypeCounts.put("selection", 0);
            expectedTypeCounts.put("table", 0);
            expectedTypeCounts.put("reference", 0);
            int totalExpectedSubSections = 0;

            for (SyllabusesTemplatemainsection newTplSec : newTemplateSections) {
                SyllabusesMainsection newSec = new SyllabusesMainsection();
                newSec.setName(newTplSec.getName());
                newSec.setCreatedDate(new Date());
                newSec.setCode(newTplSec.getCode());
                newSec.setPosition(newTplSec.getPosition());
                newSec.setSyllabusId(newSyllabus);
                newSec = mainSectionRepo.save(newSec);

                Map<String, SyllabusesSubsection> oldSubMap = new HashMap<>();
                if (oldSecMap.containsKey(newTplSec.getCode())) {
                    List<SyllabusesSubsection> oldSubs = this.subSectionRepo.findByMainSectionId(oldSecMap.get(newTplSec.getCode()));
                    for (SyllabusesSubsection oldSub : oldSubs) {
                        oldSubMap.put(oldSub.getCode(), oldSub);
                    }
                }

                List<SyllabusesTemplatesubsection> newTplSubs = this.templateSubRepo.findByMainSectionId(newTplSec);

                for (SyllabusesTemplatesubsection newTplSub : newTplSubs) {
                    // Tăng bộ đếm kỳ vọng theo loại
                    String type = newTplSub.getType().toLowerCase();
                    expectedTypeCounts.put(type, expectedTypeCounts.getOrDefault(type, 0) + 1);
                    totalExpectedSubSections++;

                    SyllabusesSubsection newSub = new SyllabusesSubsection();
                    newSub.setName(newTplSub.getName());
                    newSub.setCode(newTplSub.getCode());
                    newSub.setType(newTplSub.getType());
                    newSub.setPosition(newTplSub.getPosition());
                    newSub.setMainSectionId(newSec);
                    newSub.setCreatedDate(new Date());
                    newSub = subSectionRepo.save(newSub);

                    boolean isCustom = List.of("text", "selection", "table").contains(newTplSub.getType());
                    if (oldSubMap.containsKey(newTplSub.getCode())) {
                        SyllabusesSubsection oldSub = oldSubMap.get(newTplSub.getCode());
                        if (isCustom) {
                            CustomSubSectionStrategy strategy = customSubRegistry.get(oldSub.getType());
                            if (strategy != null) {
                                strategy.cloneData(oldSub.getId(), newSub);
                            }
                        } else {
                            ReferencePlugin plugin = pluginRegistry.get(oldSub.getCode());
                            if (plugin != null) {
                                plugin.processSpecificData(oldSyllabus, newSyllabus, context);
                            }
                        }
                    } else {
                        if (isCustom) {
                            CustomSubSectionStrategy strategy = customSubRegistry.get(newTplSub.getType());
                            if (strategy != null) {
                                strategy.initNewData(newTplSub.getId(), newSub);
                            }
                        }
                    }
                }
            }

            // --- BƯỚC 2: KIỂM TRA ĐỐI CHIẾU SỐ LƯỢNG SAU KHI INSERT ---
            validateInsertedSubSections(newSyllabus, totalExpectedSubSections, expectedTypeCounts);
        }
    }

    /**
     * Hàm kiểm tra số lượng bản ghi thực tế trong DB so với kỳ vọng từ
     * Template. Ném RuntimeException để kích hoạt Rollback nếu không khớp.
     */
    private void validateInsertedSubSections(SyllabusesSyllabus newSyllabus,
            int totalExpected,
            Map<String, Integer> expectedCounts) {
        // 1. Kiểm tra tổng số lượng ở bảng cha (syllabuses_subsection)
        long actualTotal = this.subSectionRepo.countBySyllabus(newSyllabus);
        if (actualTotal != totalExpected) {
            throw new RuntimeException(String.format(
                    "Lỗi Clone: Tổng số SubSection không khớp! Kỳ vọng: %d, Thực tế DB: %d",
                    totalExpected, actualTotal));
        }

        // 2. Kiểm tra chi tiết từng bảng con theo Type
        long actualText = this.textSubSectionRepo.countBySyllabus(newSyllabus);
        long actualSelection = this.selectionSubSectionRepo.countBySyllabus(newSyllabus);
        long actualTable = this.tableSubSectionRepo.countBySyllabus(newSyllabus);
        long actualReference = this.referenceSubSectionRepo.countBySyllabus(newSyllabus);

        if (actualText != expectedCounts.getOrDefault("text", 0)) {
            throw new RuntimeException(String.format(
                    "Lỗi Clone: Thiếu bản ghi TextSubSection! Kỳ vọng: %d, Thực tế DB: %d",
                    expectedCounts.get("text"), actualText));
        }
        if (actualSelection != expectedCounts.getOrDefault("selection", 0)) {
            throw new RuntimeException(String.format(
                    "Lỗi Clone: Thiếu bản ghi SelectionSubSection! Kỳ vọng: %d, Thực tế DB: %d",
                    expectedCounts.get("selection"), actualSelection));
        }
        if (actualTable != expectedCounts.getOrDefault("table", 0)) {
            throw new RuntimeException(String.format(
                    "Lỗi Clone: Thiếu bản ghi TableSubSection! Kỳ vọng: %d, Thực tế DB: %d",
                    expectedCounts.get("table"), actualTable));
        }
        if (actualReference != expectedCounts.getOrDefault("reference", 0)) {
            throw new RuntimeException(String.format(
                    "Lỗi Clone: Thiếu bản ghi ReferenceSubSection! Kỳ vọng: %d, Thực tế DB: %d",
                    expectedCounts.get("reference"), actualReference));
        }
    }
}
