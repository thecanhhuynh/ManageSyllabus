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
import jakarta.persistence.OneToOne;
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
@Table(name = "syllabuses_lecturer")
@NamedQueries({
    @NamedQuery(name = "SyllabusesLecturer.findAll", query = "SELECT s FROM SyllabusesLecturer s"),
    @NamedQuery(name = "SyllabusesLecturer.findById", query = "SELECT s FROM SyllabusesLecturer s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesLecturer.findByCreatedDate", query = "SELECT s FROM SyllabusesLecturer s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesLecturer.findByRoom", query = "SELECT s FROM SyllabusesLecturer s WHERE s.room = :room")})
public class SyllabusesLecturer implements Serializable {

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
    @Column(name = "room")
    private String room;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "lecturerId")
    private Set<SyllabusesSyllabus> syllabusesSyllabusSet;
    @JoinColumn(name = "faculty_id", referencedColumnName = "id")
    @ManyToOne
    private SyllabusesFaculty facultyId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @OneToOne(optional = false)
    private SyllabusesUser userId;

    public SyllabusesLecturer() {
    }

    public SyllabusesLecturer(Long id) {
        this.id = id;
    }

    public SyllabusesLecturer(Long id, Date createdDate) {
        this.id = id;
        this.createdDate = createdDate;
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

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public Set<SyllabusesSyllabus> getSyllabusesSyllabusSet() {
        return syllabusesSyllabusSet;
    }

    public void setSyllabusesSyllabusSet(Set<SyllabusesSyllabus> syllabusesSyllabusSet) {
        this.syllabusesSyllabusSet = syllabusesSyllabusSet;
    }

    public SyllabusesFaculty getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(SyllabusesFaculty facultyId) {
        this.facultyId = facultyId;
    }

    public SyllabusesUser getUserId() {
        return userId;
    }

    public void setUserId(SyllabusesUser userId) {
        this.userId = userId;
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
        if (!(object instanceof SyllabusesLecturer)) {
            return false;
        }
        SyllabusesLecturer other = (SyllabusesLecturer) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesLecturer[ id=" + id + " ]";
    }
    
}
