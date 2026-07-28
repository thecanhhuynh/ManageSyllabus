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
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.io.Serializable;
import java.util.Date;
import java.util.Set;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_method")
@NamedQueries({
    @NamedQuery(name = "SyllabusesMethod.findAll", query = "SELECT s FROM SyllabusesMethod s"),
    @NamedQuery(name = "SyllabusesMethod.findById", query = "SELECT s FROM SyllabusesMethod s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesMethod.findByName", query = "SELECT s FROM SyllabusesMethod s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesMethod.findByCreatedDate", query = "SELECT s FROM SyllabusesMethod s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesMethod.findByWeight", query = "SELECT s FROM SyllabusesMethod s WHERE s.weight = :weight")})
public class SyllabusesMethod implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "name")
    private String name;
    @Basic(optional = false)
    @Column(name = "created_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;
    @Lob
    @Column(name = "time")
    private String time;
    @Column(name = "weight")
    private Integer weight;
    @JoinColumn(name = "assessment_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesAssessment assessmentId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "methodId")
    private Set<SyllabusesMethodcourselearningoutcome> syllabusesMethodcourselearningoutcomeSet;

    public SyllabusesMethod() {
    }

    public SyllabusesMethod(Long id) {
        this.id = id;
    }

    public SyllabusesMethod(Long id, String name, Date createdDate) {
        this.id = id;
        this.name = name;
        this.createdDate = createdDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public Integer getWeight() {
        return weight;
    }

    public void setWeight(Integer weight) {
        this.weight = weight;
    }

    public SyllabusesAssessment getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(SyllabusesAssessment assessmentId) {
        this.assessmentId = assessmentId;
    }

    public Set<SyllabusesMethodcourselearningoutcome> getSyllabusesMethodcourselearningoutcomeSet() {
        return syllabusesMethodcourselearningoutcomeSet;
    }

    public void setSyllabusesMethodcourselearningoutcomeSet(Set<SyllabusesMethodcourselearningoutcome> syllabusesMethodcourselearningoutcomeSet) {
        this.syllabusesMethodcourselearningoutcomeSet = syllabusesMethodcourselearningoutcomeSet;
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
        if (!(object instanceof SyllabusesMethod)) {
            return false;
        }
        SyllabusesMethod other = (SyllabusesMethod) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesMethod[ id=" + id + " ]";
    }
    
}
