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
@Table(name = "syllabuses_courseobjectiveprogrammelearningoutcome")
@NamedQueries({
    @NamedQuery(name = "SyllabusesCourseobjectiveprogrammelearningoutcome.findAll", query = "SELECT s FROM SyllabusesCourseobjectiveprogrammelearningoutcome s"),
    @NamedQuery(name = "SyllabusesCourseobjectiveprogrammelearningoutcome.findById", query = "SELECT s FROM SyllabusesCourseobjectiveprogrammelearningoutcome s WHERE s.id = :id")})
public class SyllabusesCourseobjectiveprogrammelearningoutcome implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @JoinColumn(name = "course_objective_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesCourseobjective courseObjectiveId;
    @JoinColumn(name = "programme_learning_outcome_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesProgrammelearningoutcome programmeLearningOutcomeId;

    public SyllabusesCourseobjectiveprogrammelearningoutcome() {
    }

    public SyllabusesCourseobjectiveprogrammelearningoutcome(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SyllabusesCourseobjective getCourseObjectiveId() {
        return courseObjectiveId;
    }

    public void setCourseObjectiveId(SyllabusesCourseobjective courseObjectiveId) {
        this.courseObjectiveId = courseObjectiveId;
    }

    public SyllabusesProgrammelearningoutcome getProgrammeLearningOutcomeId() {
        return programmeLearningOutcomeId;
    }

    public void setProgrammeLearningOutcomeId(SyllabusesProgrammelearningoutcome programmeLearningOutcomeId) {
        this.programmeLearningOutcomeId = programmeLearningOutcomeId;
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
        if (!(object instanceof SyllabusesCourseobjectiveprogrammelearningoutcome)) {
            return false;
        }
        SyllabusesCourseobjectiveprogrammelearningoutcome other = (SyllabusesCourseobjectiveprogrammelearningoutcome) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesCourseobjectiveprogrammelearningoutcome[ id=" + id + " ]";
    }
    
}
