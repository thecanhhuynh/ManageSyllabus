/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.repository;

import com.htc.pojo.SyllabusesSubsection;
import java.util.List;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 *
 * @author Admin
 */

@Repository
public interface SubSectionRepository extends JpaRepository<SyllabusesSubsection, Long>{
    List<SyllabusesSubsection> findByMainSectionId(Long mainSectionId);
}
