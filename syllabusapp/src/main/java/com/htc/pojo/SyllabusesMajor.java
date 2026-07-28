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
@Table(name = "syllabuses_major")
@NamedQueries({
    @NamedQuery(name = "SyllabusesMajor.findAll", query = "SELECT s FROM SyllabusesMajor s"),
    @NamedQuery(name = "SyllabusesMajor.findById", query = "SELECT s FROM SyllabusesMajor s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesMajor.findByCreatedDate", query = "SELECT s FROM SyllabusesMajor s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesMajor.findByName", query = "SELECT s FROM SyllabusesMajor s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesMajor.findByCode", query = "SELECT s FROM SyllabusesMajor s WHERE s.code = :code")})
public class SyllabusesMajor implements Serializable {

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
    @Column(name = "code")
    private String code;
    @JoinColumn(name = "faculty_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesFaculty facultyId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "majorId")
    private Set<SyllabusesTrainingprogram> syllabusesTrainingprogramSet;

    public SyllabusesMajor() {
    }

    public SyllabusesMajor(Long id) {
        this.id = id;
    }

    public SyllabusesMajor(Long id, Date createdDate, String name, String code) {
        this.id = id;
        this.createdDate = createdDate;
        this.name = name;
        this.code = code;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public SyllabusesFaculty getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(SyllabusesFaculty facultyId) {
        this.facultyId = facultyId;
    }

    public Set<SyllabusesTrainingprogram> getSyllabusesTrainingprogramSet() {
        return syllabusesTrainingprogramSet;
    }

    public void setSyllabusesTrainingprogramSet(Set<SyllabusesTrainingprogram> syllabusesTrainingprogramSet) {
        this.syllabusesTrainingprogramSet = syllabusesTrainingprogramSet;
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
        if (!(object instanceof SyllabusesMajor)) {
            return false;
        }
        SyllabusesMajor other = (SyllabusesMajor) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesMajor[ id=" + id + " ]";
    }
    
}
