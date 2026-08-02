/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.repository;

import com.htc.pojo.SyllabusesMainsection;
import com.htc.pojo.SyllabusesSubsection;
import com.htc.pojo.SyllabusesSyllabus;
import java.util.List;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 *
 * @author Admin
 */

@Repository
public interface SubSectionRepository extends JpaRepository<SyllabusesSubsection, Long>{
    List<SyllabusesSubsection> findByMainSectionId(SyllabusesMainsection mainSectionId);
    @Query("SELECT COUNT(s) FROM SyllabusesSubsection s WHERE s.mainSectionId.syllabusId = :syllabus")
    long countBySyllabus(@Param("syllabus") SyllabusesSyllabus syllabus);
}
