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
@Table(name = "syllabuses_requirementsubject")
@NamedQueries({
    @NamedQuery(name = "SyllabusesRequirementsubject.findAll", query = "SELECT s FROM SyllabusesRequirementsubject s"),
    @NamedQuery(name = "SyllabusesRequirementsubject.findById", query = "SELECT s FROM SyllabusesRequirementsubject s WHERE s.id = :id")})
public class SyllabusesRequirementsubject implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @JoinColumn(name = "require_subject_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesSubject requireSubjectId;
    @JoinColumn(name = "subject_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesSubject subjectId;
    @JoinColumn(name = "type_requirement_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesTyperequirement typeRequirementId;

    public SyllabusesRequirementsubject() {
    }

    public SyllabusesRequirementsubject(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SyllabusesSubject getRequireSubjectId() {
        return requireSubjectId;
    }

    public void setRequireSubjectId(SyllabusesSubject requireSubjectId) {
        this.requireSubjectId = requireSubjectId;
    }

    public SyllabusesSubject getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(SyllabusesSubject subjectId) {
        this.subjectId = subjectId;
    }

    public SyllabusesTyperequirement getTypeRequirementId() {
        return typeRequirementId;
    }

    public void setTypeRequirementId(SyllabusesTyperequirement typeRequirementId) {
        this.typeRequirementId = typeRequirementId;
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
        if (!(object instanceof SyllabusesRequirementsubject)) {
            return false;
        }
        SyllabusesRequirementsubject other = (SyllabusesRequirementsubject) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesRequirementsubject[ id=" + id + " ]";
    }
    
}
