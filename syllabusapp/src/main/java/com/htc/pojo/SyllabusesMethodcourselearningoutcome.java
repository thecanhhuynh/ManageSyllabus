/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import java.io.Serializable;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_methodcourselearningoutcome")
@NamedQueries({
    @NamedQuery(name = "SyllabusesMethodcourselearningoutcome.findAll", query = "SELECT s FROM SyllabusesMethodcourselearningoutcome s"),
    @NamedQuery(name = "SyllabusesMethodcourselearningoutcome.findById", query = "SELECT s FROM SyllabusesMethodcourselearningoutcome s WHERE s.id = :id")})
public class SyllabusesMethodcourselearningoutcome implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @JoinColumn(name = "clo_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesCourselearningoutcome cloId;
    @JoinColumn(name = "method_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesMethod methodId;

    public SyllabusesMethodcourselearningoutcome() {
    }

    public SyllabusesMethodcourselearningoutcome(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SyllabusesCourselearningoutcome getCloId() {
        return cloId;
    }

    public void setCloId(SyllabusesCourselearningoutcome cloId) {
        this.cloId = cloId;
    }

    public SyllabusesMethod getMethodId() {
        return methodId;
    }

    public void setMethodId(SyllabusesMethod methodId) {
        this.methodId = methodId;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof SyllabusesMethodcourselearningoutcome)) {
            return false;
        }
        SyllabusesMethodcourselearningoutcome other = (SyllabusesMethodcourselearningoutcome) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesMethodcourselearningoutcome[ id=" + id + " ]";
    }
    
}
