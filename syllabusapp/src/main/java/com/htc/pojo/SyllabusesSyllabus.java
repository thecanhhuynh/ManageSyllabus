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
@Table(name = "syllabuses_syllabus")
@NamedQueries({
    @NamedQuery(name = "SyllabusesSyllabus.findAll", query = "SELECT s FROM SyllabusesSyllabus s"),
    @NamedQuery(name = "SyllabusesSyllabus.findById", query = "SELECT s FROM SyllabusesSyllabus s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesSyllabus.findByName", query = "SELECT s FROM SyllabusesSyllabus s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesSyllabus.findByStatus", query = "SELECT s FROM SyllabusesSyllabus s WHERE s.status = :status"),
    @NamedQuery(name = "SyllabusesSyllabus.findByCreatedDate", query = "SELECT s FROM SyllabusesSyllabus s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesSyllabus.findByStartDateEdition", query = "SELECT s FROM SyllabusesSyllabus s WHERE s.startDateEdition = :startDateEdition"),
    @NamedQuery(name = "SyllabusesSyllabus.findByEndDateEdition", query = "SELECT s FROM SyllabusesSyllabus s WHERE s.endDateEdition = :endDateEdition"),
    @NamedQuery(name = "SyllabusesSyllabus.findByEditDate", query = "SELECT s FROM SyllabusesSyllabus s WHERE s.editDate = :editDate"),
    @NamedQuery(name = "SyllabusesSyllabus.findByVersion", query = "SELECT s FROM SyllabusesSyllabus s WHERE s.version = :version")})
public class SyllabusesSyllabus implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Column(name = "name")
    private String name;
    @Column(name = "status")
    private String status;
    @Basic(optional = false)
    @Column(name = "created_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;
    @Basic(optional = false)
    @Column(name = "start_date_edition")
    @Temporal(TemporalType.TIMESTAMP)
    private Date startDateEdition;
    @Basic(optional = false)
    @Column(name = "end_date_edition")
    @Temporal(TemporalType.TIMESTAMP)
    private Date endDateEdition;
    @Column(name = "edit_date")
    private String editDate;
    @Basic(optional = false)
    @Column(name = "version")
    private String version;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "syllabusId")
    private Set<SyllabusesCourseobjective> syllabusesCourseobjectiveSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "syllabusId")
    private Set<SyllabusesSyllabuslearningmaterial> syllabusesSyllabuslearningmaterialSet;
    @JoinColumn(name = "faculty_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesFaculty facultyId;
    @JoinColumn(name = "lecturer_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesLecturer lecturerId;
    @JoinColumn(name = "subject_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesSubject subjectId;
    @OneToMany(mappedBy = "parentId")
    private Set<SyllabusesSyllabus> syllabusesSyllabusSet;
    @JoinColumn(name = "parent_id", referencedColumnName = "id")
    @ManyToOne
    private SyllabusesSyllabus parentId;
    @JoinColumn(name = "template_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesTemplatesyllabus templateId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "syllabusId")
    private Set<SyllabusesAssessment> syllabusesAssessmentSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "syllabusId")
    private Set<SyllabusesTeachingsession> syllabusesTeachingsessionSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "syllabusId")
    private Set<SyllabusesMainsection> syllabusesMainsectionSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "syllabusId")
    private Set<SyllabusesTrainingprogramsyllabus> syllabusesTrainingprogramsyllabusSet;

    public SyllabusesSyllabus() {
    }

    public SyllabusesSyllabus(Long id) {
        this.id = id;
    }

    public SyllabusesSyllabus(Long id, Date createdDate, Date startDateEdition, Date endDateEdition, String version) {
        this.id = id;
        this.createdDate = createdDate;
        this.startDateEdition = startDateEdition;
        this.endDateEdition = endDateEdition;
        this.version = version;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public Date getStartDateEdition() {
        return startDateEdition;
    }

    public void setStartDateEdition(Date startDateEdition) {
        this.startDateEdition = startDateEdition;
    }

    public Date getEndDateEdition() {
        return endDateEdition;
    }

    public void setEndDateEdition(Date endDateEdition) {
        this.endDateEdition = endDateEdition;
    }

    public String getEditDate() {
        return editDate;
    }

    public void setEditDate(String editDate) {
        this.editDate = editDate;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Set<SyllabusesCourseobjective> getSyllabusesCourseobjectiveSet() {
        return syllabusesCourseobjectiveSet;
    }

    public void setSyllabusesCourseobjectiveSet(Set<SyllabusesCourseobjective> syllabusesCourseobjectiveSet) {
        this.syllabusesCourseobjectiveSet = syllabusesCourseobjectiveSet;
    }

    public Set<SyllabusesSyllabuslearningmaterial> getSyllabusesSyllabuslearningmaterialSet() {
        return syllabusesSyllabuslearningmaterialSet;
    }

    public void setSyllabusesSyllabuslearningmaterialSet(Set<SyllabusesSyllabuslearningmaterial> syllabusesSyllabuslearningmaterialSet) {
        this.syllabusesSyllabuslearningmaterialSet = syllabusesSyllabuslearningmaterialSet;
    }

    public SyllabusesFaculty getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(SyllabusesFaculty facultyId) {
        this.facultyId = facultyId;
    }

    public SyllabusesLecturer getLecturerId() {
        return lecturerId;
    }

    public void setLecturerId(SyllabusesLecturer lecturerId) {
        this.lecturerId = lecturerId;
    }

    public SyllabusesSubject getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(SyllabusesSubject subjectId) {
        this.subjectId = subjectId;
    }

    public Set<SyllabusesSyllabus> getSyllabusesSyllabusSet() {
        return syllabusesSyllabusSet;
    }

    public void setSyllabusesSyllabusSet(Set<SyllabusesSyllabus> syllabusesSyllabusSet) {
        this.syllabusesSyllabusSet = syllabusesSyllabusSet;
    }

    public SyllabusesSyllabus getParentId() {
        return parentId;
    }

    public void setParentId(SyllabusesSyllabus parentId) {
        this.parentId = parentId;
    }

    public SyllabusesTemplatesyllabus getTemplateId() {
        return templateId;
    }

    public void setTemplateId(SyllabusesTemplatesyllabus templateId) {
        this.templateId = templateId;
    }

    public Set<SyllabusesAssessment> getSyllabusesAssessmentSet() {
        return syllabusesAssessmentSet;
    }

    public void setSyllabusesAssessmentSet(Set<SyllabusesAssessment> syllabusesAssessmentSet) {
        this.syllabusesAssessmentSet = syllabusesAssessmentSet;
    }

    public Set<SyllabusesTeachingsession> getSyllabusesTeachingsessionSet() {
        return syllabusesTeachingsessionSet;
    }

    public void setSyllabusesTeachingsessionSet(Set<SyllabusesTeachingsession> syllabusesTeachingsessionSet) {
        this.syllabusesTeachingsessionSet = syllabusesTeachingsessionSet;
    }

    public Set<SyllabusesMainsection> getSyllabusesMainsectionSet() {
        return syllabusesMainsectionSet;
    }

    public void setSyllabusesMainsectionSet(Set<SyllabusesMainsection> syllabusesMainsectionSet) {
        this.syllabusesMainsectionSet = syllabusesMainsectionSet;
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
        if (!(object instanceof SyllabusesSyllabus)) {
            return false;
        }
        SyllabusesSyllabus other = (SyllabusesSyllabus) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesSyllabus[ id=" + id + " ]";
    }
    
}
