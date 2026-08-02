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
import jakarta.persistence.Lob;
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
@Table(name = "syllabuses_programmelearningoutcome")
@NamedQueries({
    @NamedQuery(name = "SyllabusesProgrammelearningoutcome.findAll", query = "SELECT s FROM SyllabusesProgrammelearningoutcome s"),
    @NamedQuery(name = "SyllabusesProgrammelearningoutcome.findById", query = "SELECT s FROM SyllabusesProgrammelearningoutcome s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesProgrammelearningoutcome.findByName", query = "SELECT s FROM SyllabusesProgrammelearningoutcome s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesProgrammelearningoutcome.findByCreatedDate", query = "SELECT s FROM SyllabusesProgrammelearningoutcome s WHERE s.createdDate = :createdDate")})
public class SyllabusesProgrammelearningoutcome implements Serializable {

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
    @Basic(optional = false)
    @Lob
    @Column(name = "description")
    private String description;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "programmeLearningOutcomeId")
    private Set<SyllabusesCourseobjectiveprogrammelearningoutcome> syllabusesCourseobjectiveprogrammelearningoutcomeSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "ploId")
    private Set<SyllabusesCloploassociation> syllabusesCloploassociationSet;

    public SyllabusesProgrammelearningoutcome() {
    }

    public SyllabusesProgrammelearningoutcome(Long id) {
        this.id = id;
    }

    public SyllabusesProgrammelearningoutcome(Long id, String name, Date createdDate, String description) {
        this.id = id;
        this.name = name;
        this.createdDate = createdDate;
        this.description = description;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<SyllabusesCourseobjectiveprogrammelearningoutcome> getSyllabusesCourseobjectiveprogrammelearningoutcomeSet() {
        return syllabusesCourseobjectiveprogrammelearningoutcomeSet;
    }

    public void setSyllabusesCourseobjectiveprogrammelearningoutcomeSet(Set<SyllabusesCourseobjectiveprogrammelearningoutcome> syllabusesCourseobjectiveprogrammelearningoutcomeSet) {
        this.syllabusesCourseobjectiveprogrammelearningoutcomeSet = syllabusesCourseobjectiveprogrammelearningoutcomeSet;
    }

    public Set<SyllabusesCloploassociation> getSyllabusesCloploassociationSet() {
        return syllabusesCloploassociationSet;
    }

    public void setSyllabusesCloploassociationSet(Set<SyllabusesCloploassociation> syllabusesCloploassociationSet) {
        this.syllabusesCloploassociationSet = syllabusesCloploassociationSet;
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
        if (!(object instanceof SyllabusesProgrammelearningoutcome)) {
            return false;
        }
        SyllabusesProgrammelearningoutcome other = (SyllabusesProgrammelearningoutcome) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesProgrammelearningoutcome[ id=" + id + " ]";
    }
    
}
