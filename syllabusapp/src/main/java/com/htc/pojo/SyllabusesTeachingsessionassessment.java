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
@Table(name = "syllabuses_teachingsessionassessment")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTeachingsessionassessment.findAll", query = "SELECT s FROM SyllabusesTeachingsessionassessment s"),
    @NamedQuery(name = "SyllabusesTeachingsessionassessment.findById", query = "SELECT s FROM SyllabusesTeachingsessionassessment s WHERE s.id = :id")})
public class SyllabusesTeachingsessionassessment implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @JoinColumn(name = "assessment_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesAssessment assessmentId;
    @JoinColumn(name = "teaching_session_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesTeachingsession teachingSessionId;

    public SyllabusesTeachingsessionassessment() {
    }

    public SyllabusesTeachingsessionassessment(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SyllabusesAssessment getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(SyllabusesAssessment assessmentId) {
        this.assessmentId = assessmentId;
    }

    public SyllabusesTeachingsession getTeachingSessionId() {
        return teachingSessionId;
    }

    public void setTeachingSessionId(SyllabusesTeachingsession teachingSessionId) {
        this.teachingSessionId = teachingSessionId;
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
        if (!(object instanceof SyllabusesTeachingsessionassessment)) {
            return false;
        }
        SyllabusesTeachingsessionassessment other = (SyllabusesTeachingsessionassessment) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTeachingsessionassessment[ id=" + id + " ]";
    }
    
}
