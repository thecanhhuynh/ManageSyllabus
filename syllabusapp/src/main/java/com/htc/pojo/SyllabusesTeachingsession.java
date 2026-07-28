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
@Table(name = "syllabuses_teachingsession")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTeachingsession.findAll", query = "SELECT s FROM SyllabusesTeachingsession s"),
    @NamedQuery(name = "SyllabusesTeachingsession.findById", query = "SELECT s FROM SyllabusesTeachingsession s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesTeachingsession.findBySessionNo", query = "SELECT s FROM SyllabusesTeachingsession s WHERE s.sessionNo = :sessionNo"),
    @NamedQuery(name = "SyllabusesTeachingsession.findByOfflineHours", query = "SELECT s FROM SyllabusesTeachingsession s WHERE s.offlineHours = :offlineHours"),
    @NamedQuery(name = "SyllabusesTeachingsession.findByOnlineHours", query = "SELECT s FROM SyllabusesTeachingsession s WHERE s.onlineHours = :onlineHours"),
    @NamedQuery(name = "SyllabusesTeachingsession.findBySelfStudyHours", query = "SELECT s FROM SyllabusesTeachingsession s WHERE s.selfStudyHours = :selfStudyHours")})
public class SyllabusesTeachingsession implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "session_no")
    private int sessionNo;
    @Basic(optional = false)
    @Lob
    @Column(name = "content")
    private String content;
    @Lob
    @Column(name = "offline_activity")
    private String offlineActivity;
    @Basic(optional = false)
    @Column(name = "offline_hours")
    private double offlineHours;
    @Lob
    @Column(name = "online_activity")
    private String onlineActivity;
    @Basic(optional = false)
    @Column(name = "online_hours")
    private double onlineHours;
    @Lob
    @Column(name = "self_study_activity")
    private String selfStudyActivity;
    @Basic(optional = false)
    @Column(name = "self_study_hours")
    private double selfStudyHours;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "teachingSessionId")
    private Set<SyllabusesTeachingsessioncourselearningoutcome> syllabusesTeachingsessioncourselearningoutcomeSet;
    @JoinColumn(name = "schedule_group_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesSchedulegroup scheduleGroupId;
    @JoinColumn(name = "syllabus_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesSyllabus syllabusId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "teachingSessionId")
    private Set<SyllabusesTeachingsessionlearningmaterial> syllabusesTeachingsessionlearningmaterialSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "teachingSessionId")
    private Set<SyllabusesTeachingsessionassessment> syllabusesTeachingsessionassessmentSet;

    public SyllabusesTeachingsession() {
    }

    public SyllabusesTeachingsession(Long id) {
        this.id = id;
    }

    public SyllabusesTeachingsession(Long id, int sessionNo, String content, double offlineHours, double onlineHours, double selfStudyHours) {
        this.id = id;
        this.sessionNo = sessionNo;
        this.content = content;
        this.offlineHours = offlineHours;
        this.onlineHours = onlineHours;
        this.selfStudyHours = selfStudyHours;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getSessionNo() {
        return sessionNo;
    }

    public void setSessionNo(int sessionNo) {
        this.sessionNo = sessionNo;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getOfflineActivity() {
        return offlineActivity;
    }

    public void setOfflineActivity(String offlineActivity) {
        this.offlineActivity = offlineActivity;
    }

    public double getOfflineHours() {
        return offlineHours;
    }

    public void setOfflineHours(double offlineHours) {
        this.offlineHours = offlineHours;
    }

    public String getOnlineActivity() {
        return onlineActivity;
    }

    public void setOnlineActivity(String onlineActivity) {
        this.onlineActivity = onlineActivity;
    }

    public double getOnlineHours() {
        return onlineHours;
    }

    public void setOnlineHours(double onlineHours) {
        this.onlineHours = onlineHours;
    }

    public String getSelfStudyActivity() {
        return selfStudyActivity;
    }

    public void setSelfStudyActivity(String selfStudyActivity) {
        this.selfStudyActivity = selfStudyActivity;
    }

    public double getSelfStudyHours() {
        return selfStudyHours;
    }

    public void setSelfStudyHours(double selfStudyHours) {
        this.selfStudyHours = selfStudyHours;
    }

    public Set<SyllabusesTeachingsessioncourselearningoutcome> getSyllabusesTeachingsessioncourselearningoutcomeSet() {
        return syllabusesTeachingsessioncourselearningoutcomeSet;
    }

    public void setSyllabusesTeachingsessioncourselearningoutcomeSet(Set<SyllabusesTeachingsessioncourselearningoutcome> syllabusesTeachingsessioncourselearningoutcomeSet) {
        this.syllabusesTeachingsessioncourselearningoutcomeSet = syllabusesTeachingsessioncourselearningoutcomeSet;
    }

    public SyllabusesSchedulegroup getScheduleGroupId() {
        return scheduleGroupId;
    }

    public void setScheduleGroupId(SyllabusesSchedulegroup scheduleGroupId) {
        this.scheduleGroupId = scheduleGroupId;
    }

    public SyllabusesSyllabus getSyllabusId() {
        return syllabusId;
    }

    public void setSyllabusId(SyllabusesSyllabus syllabusId) {
        this.syllabusId = syllabusId;
    }

    public Set<SyllabusesTeachingsessionlearningmaterial> getSyllabusesTeachingsessionlearningmaterialSet() {
        return syllabusesTeachingsessionlearningmaterialSet;
    }

    public void setSyllabusesTeachingsessionlearningmaterialSet(Set<SyllabusesTeachingsessionlearningmaterial> syllabusesTeachingsessionlearningmaterialSet) {
        this.syllabusesTeachingsessionlearningmaterialSet = syllabusesTeachingsessionlearningmaterialSet;
    }

    public Set<SyllabusesTeachingsessionassessment> getSyllabusesTeachingsessionassessmentSet() {
        return syllabusesTeachingsessionassessmentSet;
    }

    public void setSyllabusesTeachingsessionassessmentSet(Set<SyllabusesTeachingsessionassessment> syllabusesTeachingsessionassessmentSet) {
        this.syllabusesTeachingsessionassessmentSet = syllabusesTeachingsessionassessmentSet;
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
        if (!(object instanceof SyllabusesTeachingsession)) {
            return false;
        }
        SyllabusesTeachingsession other = (SyllabusesTeachingsession) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTeachingsession[ id=" + id + " ]";
    }
    
}
