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
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Set;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_subject")
@NamedQueries({
    @NamedQuery(name = "SyllabusesSubject.findAll", query = "SELECT s FROM SyllabusesSubject s"),
    @NamedQuery(name = "SyllabusesSubject.findById", query = "SELECT s FROM SyllabusesSubject s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesSubject.findByCode", query = "SELECT s FROM SyllabusesSubject s WHERE s.code = :code"),
    @NamedQuery(name = "SyllabusesSubject.findByName", query = "SELECT s FROM SyllabusesSubject s WHERE s.name = :name")})
public class SyllabusesSubject implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "code")
    private String code;
    @Basic(optional = false)
    @Column(name = "name")
    private String name;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "requireSubjectId")
    private Set<SyllabusesRequirementsubject> syllabusesRequirementsubjectSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "subjectId")
    private Set<SyllabusesRequirementsubject> syllabusesRequirementsubjectSet1;
    @JoinColumn(name = "credit_id", referencedColumnName = "id")
    @OneToOne(optional = false)
    private SyllabusesCredit creditId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "subjectId")
    private Set<SyllabusesSyllabus> syllabusesSyllabusSet;

    public SyllabusesSubject() {
    }

    public SyllabusesSubject(Long id) {
        this.id = id;
    }

    public SyllabusesSubject(Long id, String code, String name) {
        this.id = id;
        this.code = code;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<SyllabusesRequirementsubject> getSyllabusesRequirementsubjectSet() {
        return syllabusesRequirementsubjectSet;
    }

    public void setSyllabusesRequirementsubjectSet(Set<SyllabusesRequirementsubject> syllabusesRequirementsubjectSet) {
        this.syllabusesRequirementsubjectSet = syllabusesRequirementsubjectSet;
    }

    public Set<SyllabusesRequirementsubject> getSyllabusesRequirementsubjectSet1() {
        return syllabusesRequirementsubjectSet1;
    }

    public void setSyllabusesRequirementsubjectSet1(Set<SyllabusesRequirementsubject> syllabusesRequirementsubjectSet1) {
        this.syllabusesRequirementsubjectSet1 = syllabusesRequirementsubjectSet1;
    }

    public SyllabusesCredit getCreditId() {
        return creditId;
    }

    public void setCreditId(SyllabusesCredit creditId) {
        this.creditId = creditId;
    }

    public Set<SyllabusesSyllabus> getSyllabusesSyllabusSet() {
        return syllabusesSyllabusSet;
    }

    public void setSyllabusesSyllabusSet(Set<SyllabusesSyllabus> syllabusesSyllabusSet) {
        this.syllabusesSyllabusSet = syllabusesSyllabusSet;
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
        if (!(object instanceof SyllabusesSubject)) {
            return false;
        }
        SyllabusesSubject other = (SyllabusesSubject) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesSubject[ id=" + id + " ]";
    }
    
}
