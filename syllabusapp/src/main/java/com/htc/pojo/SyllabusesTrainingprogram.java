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
@Table(name = "syllabuses_trainingprogram")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTrainingprogram.findAll", query = "SELECT s FROM SyllabusesTrainingprogram s"),
    @NamedQuery(name = "SyllabusesTrainingprogram.findById", query = "SELECT s FROM SyllabusesTrainingprogram s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesTrainingprogram.findByCreatedDate", query = "SELECT s FROM SyllabusesTrainingprogram s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesTrainingprogram.findByName", query = "SELECT s FROM SyllabusesTrainingprogram s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesTrainingprogram.findByAcademicYear", query = "SELECT s FROM SyllabusesTrainingprogram s WHERE s.academicYear = :academicYear")})
public class SyllabusesTrainingprogram implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "created_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;
    @Basic(optional = false)
    @Column(name = "name")
    private String name;
    @Basic(optional = false)
    @Column(name = "academic_year")
    private int academicYear;
    @JoinColumn(name = "major_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesMajor majorId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "trainingProgramId")
    private Set<SyllabusesTrainingprogramsyllabus> syllabusesTrainingprogramsyllabusSet;

    public SyllabusesTrainingprogram() {
    }

    public SyllabusesTrainingprogram(Long id) {
        this.id = id;
    }

    public SyllabusesTrainingprogram(Long id, Date createdDate, String name, int academicYear) {
        this.id = id;
        this.createdDate = createdDate;
        this.name = name;
        this.academicYear = academicYear;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(int academicYear) {
        this.academicYear = academicYear;
    }

    public SyllabusesMajor getMajorId() {
        return majorId;
    }

    public void setMajorId(SyllabusesMajor majorId) {
        this.majorId = majorId;
    }

    public Set<SyllabusesTrainingprogramsyllabus> getSyllabusesTrainingprogramsyllabusSet() {
        return syllabusesTrainingprogramsyllabusSet;
    }

    public void setSyllabusesTrainingprogramsyllabusSet(Set<SyllabusesTrainingprogramsyllabus> syllabusesTrainingprogramsyllabusSet) {
        this.syllabusesTrainingprogramsyllabusSet = syllabusesTrainingprogramsyllabusSet;
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
        if (!(object instanceof SyllabusesTrainingprogram)) {
            return false;
        }
        SyllabusesTrainingprogram other = (SyllabusesTrainingprogram) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTrainingprogram[ id=" + id + " ]";
    }
    
}
