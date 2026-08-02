/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Set;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_assessment")
@NamedQueries({
    @NamedQuery(name = "SyllabusesAssessment.findAll", query = "SELECT s FROM SyllabusesAssessment s"),
    @NamedQuery(name = "SyllabusesAssessment.findById", query = "SELECT s FROM SyllabusesAssessment s WHERE s.id = :id")})
public class SyllabusesAssessment implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "assessmentId")
    private Set<SyllabusesMethod> syllabusesMethodSet;
    @JoinColumn(name = "syllabus_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesSyllabus syllabusId;
    @JoinColumn(name = "type_assessment_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesTypeassessment typeAssessmentId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "assessmentId")
    private Set<SyllabusesTeachingsessionassessment> syllabusesTeachingsessionassessmentSet;

    public SyllabusesAssessment() {
    }

    public SyllabusesAssessment(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Set<SyllabusesMethod> getSyllabusesMethodSet() {
        return syllabusesMethodSet;
    }

    public void setSyllabusesMethodSet(Set<SyllabusesMethod> syllabusesMethodSet) {
        this.syllabusesMethodSet = syllabusesMethodSet;
    }

    public SyllabusesSyllabus getSyllabusId() {
        return syllabusId;
    }

    public void setSyllabusId(SyllabusesSyllabus syllabusId) {
        this.syllabusId = syllabusId;
    }

    public SyllabusesTypeassessment getTypeAssessmentId() {
        return typeAssessmentId;
    }

    public void setTypeAssessmentId(SyllabusesTypeassessment typeAssessmentId) {
        this.typeAssessmentId = typeAssessmentId;
    }

    public Set<SyllabusesTeachingsessionassessment> getSyllabusesTeachingsessionassessmentSet() {
        return syllabusesTeachingsessionassessmentSet;
    }

    public void setSyllabusesTeachingsessionassessmentSet(Set<SyllabusesTeachingsessionassessment> syllabusesTeachingsessionassessmentSet) {
        this.syllabusesTeachingsessionassessmentSet = syllabusesTeachingsessionassessmentSet;
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
        if (!(object instanceof SyllabusesAssessment)) {
            return false;
        }
        SyllabusesAssessment other = (SyllabusesAssessment) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesAssessment[ id=" + id + " ]";
    }
    
}
