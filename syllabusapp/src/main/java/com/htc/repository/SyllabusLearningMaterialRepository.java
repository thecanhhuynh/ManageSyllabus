/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.repository;

import com.htc.pojo.SyllabusesSyllabus;
import com.htc.pojo.SyllabusesSyllabuslearningmaterial;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Admin
 */
@Repository
public interface SyllabusLearningMaterialRepository extends JpaRepository<SyllabusesSyllabuslearningmaterial, Long>{
    List<SyllabusesSyllabuslearningmaterial> findBySyllabusId(SyllabusesSyllabus syllabusId);
}
