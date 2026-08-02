/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.repository;

import com.htc.pojo.SyllabusesTemplateselectionsubsection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Admin
 */
@Repository
public interface TemplateSelectionRepository extends JpaRepository<SyllabusesTemplateselectionsubsection, Long>{
    
}
