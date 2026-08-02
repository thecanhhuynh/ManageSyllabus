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
@Table(name = "syllabuses_faculty")
@NamedQueries({
    @NamedQuery(name = "SyllabusesFaculty.findAll", query = "SELECT s FROM SyllabusesFaculty s"),
    @NamedQuery(name = "SyllabusesFaculty.findById", query = "SELECT s FROM SyllabusesFaculty s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesFaculty.findByCreatedDate", query = "SELECT s FROM SyllabusesFaculty s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesFaculty.findByName", query = "SELECT s FROM SyllabusesFaculty s WHERE s.name = :name")})
public class SyllabusesFaculty implements Serializable {

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
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "facultyId")
    private Set<SyllabusesMajor> syllabusesMajorSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "facultyId")
    private Set<SyllabusesSyllabus> syllabusesSyllabusSet;
    @OneToMany(mappedBy = "facultyId")
    private Set<SyllabusesLecturer> syllabusesLecturerSet;

    public SyllabusesFaculty() {
    }

    public SyllabusesFaculty(Long id) {
        this.id = id;
    }

    public SyllabusesFaculty(Long id, Date createdDate, String name) {
        this.id = id;
        this.createdDate = createdDate;
        this.name = name;
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

    public Set<SyllabusesMajor> getSyllabusesMajorSet() {
        return syllabusesMajorSet;
    }

    public void setSyllabusesMajorSet(Set<SyllabusesMajor> syllabusesMajorSet) {
        this.syllabusesMajorSet = syllabusesMajorSet;
    }

    public Set<SyllabusesSyllabus> getSyllabusesSyllabusSet() {
        return syllabusesSyllabusSet;
    }

    public void setSyllabusesSyllabusSet(Set<SyllabusesSyllabus> syllabusesSyllabusSet) {
        this.syllabusesSyllabusSet = syllabusesSyllabusSet;
    }

    public Set<SyllabusesLecturer> getSyllabusesLecturerSet() {
        return syllabusesLecturerSet;
    }

    public void setSyllabusesLecturerSet(Set<SyllabusesLecturer> syllabusesLecturerSet) {
        this.syllabusesLecturerSet = syllabusesLecturerSet;
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
        if (!(object instanceof SyllabusesFaculty)) {
            return false;
        }
        SyllabusesFaculty other = (SyllabusesFaculty) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesFaculty[ id=" + id + " ]";
    }
    
}
