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
import java.io.Serializable;
import java.util.Set;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_courselearningoutcome")
@NamedQueries({
    @NamedQuery(name = "SyllabusesCourselearningoutcome.findAll", query = "SELECT s FROM SyllabusesCourselearningoutcome s"),
    @NamedQuery(name = "SyllabusesCourselearningoutcome.findById", query = "SELECT s FROM SyllabusesCourselearningoutcome s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesCourselearningoutcome.findByPosition", query = "SELECT s FROM SyllabusesCourselearningoutcome s WHERE s.position = :position")})
public class SyllabusesCourselearningoutcome implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Lob
    @Column(name = "content")
    private String content;
    @Basic(optional = false)
    @Column(name = "position")
    private int position;
    @JoinColumn(name = "course_objective_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesCourseobjective courseObjectiveId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "cloId")
    private Set<SyllabusesCloploassociation> syllabusesCloploassociationSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "cloId")
    private Set<SyllabusesTeachingsessioncourselearningoutcome> syllabusesTeachingsessioncourselearningoutcomeSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "cloId")
    private Set<SyllabusesMethodcourselearningoutcome> syllabusesMethodcourselearningoutcomeSet;

    public SyllabusesCourselearningoutcome() {
    }

    public SyllabusesCourselearningoutcome(Long id) {
        this.id = id;
    }

    public SyllabusesCourselearningoutcome(Long id, String content, int position) {
        this.id = id;
        this.content = content;
        this.position = position;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public SyllabusesCourseobjective getCourseObjectiveId() {
        return courseObjectiveId;
    }

    public void setCourseObjectiveId(SyllabusesCourseobjective courseObjectiveId) {
        this.courseObjectiveId = courseObjectiveId;
    }

    public Set<SyllabusesCloploassociation> getSyllabusesCloploassociationSet() {
        return syllabusesCloploassociationSet;
    }

    public void setSyllabusesCloploassociationSet(Set<SyllabusesCloploassociation> syllabusesCloploassociationSet) {
        this.syllabusesCloploassociationSet = syllabusesCloploassociationSet;
    }

    public Set<SyllabusesTeachingsessioncourselearningoutcome> getSyllabusesTeachingsessioncourselearningoutcomeSet() {
        return syllabusesTeachingsessioncourselearningoutcomeSet;
    }

    public void setSyllabusesTeachingsessioncourselearningoutcomeSet(Set<SyllabusesTeachingsessioncourselearningoutcome> syllabusesTeachingsessioncourselearningoutcomeSet) {
        this.syllabusesTeachingsessioncourselearningoutcomeSet = syllabusesTeachingsessioncourselearningoutcomeSet;
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
        if (!(object instanceof SyllabusesCourselearningoutcome)) {
            return false;
        }
        SyllabusesCourselearningoutcome other = (SyllabusesCourselearningoutcome) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesCourselearningoutcome[ id=" + id + " ]";
    }
    
}
