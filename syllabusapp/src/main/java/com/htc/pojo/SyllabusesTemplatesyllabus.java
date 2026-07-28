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
@Table(name = "syllabuses_templatesyllabus")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTemplatesyllabus.findAll", query = "SELECT s FROM SyllabusesTemplatesyllabus s"),
    @NamedQuery(name = "SyllabusesTemplatesyllabus.findById", query = "SELECT s FROM SyllabusesTemplatesyllabus s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesTemplatesyllabus.findByCreatedDate", query = "SELECT s FROM SyllabusesTemplatesyllabus s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesTemplatesyllabus.findByName", query = "SELECT s FROM SyllabusesTemplatesyllabus s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesTemplatesyllabus.findByVersion", query = "SELECT s FROM SyllabusesTemplatesyllabus s WHERE s.version = :version"),
    @NamedQuery(name = "SyllabusesTemplatesyllabus.findByIsActive", query = "SELECT s FROM SyllabusesTemplatesyllabus s WHERE s.isActive = :isActive"),
    @NamedQuery(name = "SyllabusesTemplatesyllabus.findByStatus", query = "SELECT s FROM SyllabusesTemplatesyllabus s WHERE s.status = :status")})
public class SyllabusesTemplatesyllabus implements Serializable {

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
    @Column(name = "version")
    private String version;
    @Basic(optional = false)
    @Column(name = "is_active")
    private boolean isActive;
    @Basic(optional = false)
    @Column(name = "status")
    private String status;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "templateId")
    private Set<SyllabusesTemplatemainsection> syllabusesTemplatemainsectionSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "templateId")
    private Set<SyllabusesSyllabus> syllabusesSyllabusSet;

    public SyllabusesTemplatesyllabus() {
    }

    public SyllabusesTemplatesyllabus(Long id) {
        this.id = id;
    }

    public SyllabusesTemplatesyllabus(Long id, Date createdDate, String name, String version, boolean isActive, String status) {
        this.id = id;
        this.createdDate = createdDate;
        this.name = name;
        this.version = version;
        this.isActive = isActive;
        this.status = status;
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

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Set<SyllabusesTemplatemainsection> getSyllabusesTemplatemainsectionSet() {
        return syllabusesTemplatemainsectionSet;
    }

    public void setSyllabusesTemplatemainsectionSet(Set<SyllabusesTemplatemainsection> syllabusesTemplatemainsectionSet) {
        this.syllabusesTemplatemainsectionSet = syllabusesTemplatemainsectionSet;
    }

    public Set<SyllabusesSyllabus> getSyllabusesSyllabusSet() {
        return syllabusesSyllabusSet;
    }

    public void setSyllabusesSyllabusSet(Set<SyllabusesSyllabus> syllabusesSyllabusSet) {
        this.syllabusesSyllabusSet = syllabusesSyllabusSet;
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
        if (!(object instanceof SyllabusesTemplatesyllabus)) {
            return false;
        }
        SyllabusesTemplatesyllabus other = (SyllabusesTemplatesyllabus) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTemplatesyllabus[ id=" + id + " ]";
    }
    
}
