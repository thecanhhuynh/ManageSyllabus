/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.repository;

import com.htc.pojo.SyllabusesSyllabus;
import com.htc.pojo.SyllabusesTablesubsection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Admin
 */
@Repository
public interface TableSubSectionRepository extends JpaRepository<SyllabusesTablesubsection, Long>{
    @Query("SELECT COUNT(t) FROM SyllabusesTablesubsection t WHERE t.syllabusesSubsection.mainSectionId.syllabusId = :syllabus")
    long countBySyllabus(@Param("syllabus") SyllabusesSyllabus syllabus);
}
