/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.repository;

import com.htc.pojo.SyllabusesTeachingsession;
import com.htc.pojo.SyllabusesTeachingsessionlearningmaterial;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Admin
 */
@Repository
public interface SessionMaterialRepository extends JpaRepository<SyllabusesTeachingsessionlearningmaterial, Long>{
     List<SyllabusesTeachingsessionlearningmaterial> findByTeachingSessionId(SyllabusesTeachingsession s);
}
