/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.repository;
import com.htc.pojo.SyllabusesTemplatesubsection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
/**
 *
 * @author Admin
 */
@Repository
public interface TemplateSubSectionRepository extends JpaRepository<SyllabusesTemplatesubsection, Long>{
    @Query("""
        SELECT s
        FROM SyllabusesTemplatesubsection s
        WHERE s.mainSectionId.id = :mainSectionId
        ORDER BY s.position
    """)
    List<SyllabusesTemplatesubsection> findByMainSectionId(Long mainSectionId);
}
