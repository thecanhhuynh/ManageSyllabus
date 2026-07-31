/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.repository;

import com.htc.pojo.SyllabusesMethod;
import com.htc.pojo.SyllabusesMethodcourselearningoutcome;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Admin
 */
@Repository
public interface MethodCloRepository extends JpaRepository<SyllabusesMethodcourselearningoutcome, Long>{
    List<SyllabusesMethodcourselearningoutcome> findByMethodIdId(Long methodId);
}
