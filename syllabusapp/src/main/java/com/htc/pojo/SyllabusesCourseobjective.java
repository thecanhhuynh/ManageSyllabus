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
@Table(name = "syllabuses_courseobjective")
@NamedQueries({
    @NamedQuery(name = "SyllabusesCourseobjective.findAll", query = "SELECT s FROM SyllabusesCourseobjective s"),
    @NamedQuery(name = "SyllabusesCourseobjective.findById", query = "SELECT s FROM SyllabusesCourseobjective s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesCourseobjective.findByPosition", query = "SELECT s FROM SyllabusesCourseobjective s WHERE s.position = :position")})
public class SyllabusesCourseobjective implements Serializable {

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
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "courseObjectiveId")
    private Set<SyllabusesCourselearningoutcome> syllabusesCourselearningoutcomeSet;
    @JoinColumn(name = "subject_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesSubject subjectId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "courseObjectiveId")
    private Set<SyllabusesCourseobjectiveprogrammelearningoutcome> syllabusesCourseobjectiveprogrammelearningoutcomeSet;

    public SyllabusesCourseobjective() {
    }

    public SyllabusesCourseobjective(Long id) {
        this.id = id;
    }

    public SyllabusesCourseobjective(Long id, String content, int position) {
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

    public Set<SyllabusesCourselearningoutcome> getSyllabusesCourselearningoutcomeSet() {
        return syllabusesCourselearningoutcomeSet;
    }

    public void setSyllabusesCourselearningoutcomeSet(Set<SyllabusesCourselearningoutcome> syllabusesCourselearningoutcomeSet) {
        this.syllabusesCourselearningoutcomeSet = syllabusesCourselearningoutcomeSet;
    }

    public SyllabusesSubject getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(SyllabusesSubject subjectId) {
        this.subjectId = subjectId;
    }

    public Set<SyllabusesCourseobjectiveprogrammelearningoutcome> getSyllabusesCourseobjectiveprogrammelearningoutcomeSet() {
        return syllabusesCourseobjectiveprogrammelearningoutcomeSet;
    }

    public void setSyllabusesCourseobjectiveprogrammelearningoutcomeSet(Set<SyllabusesCourseobjectiveprogrammelearningoutcome> syllabusesCourseobjectiveprogrammelearningoutcomeSet) {
        this.syllabusesCourseobjectiveprogrammelearningoutcomeSet = syllabusesCourseobjectiveprogrammelearningoutcomeSet;
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
        if (!(object instanceof SyllabusesCourseobjective)) {
            return false;
        }
        SyllabusesCourseobjective other = (SyllabusesCourseobjective) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesCourseobjective[ id=" + id + " ]";
    }
    
}
