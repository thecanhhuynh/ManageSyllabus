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
@Table(name = "syllabuses_templatemainsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTemplatemainsection.findAll", query = "SELECT s FROM SyllabusesTemplatemainsection s"),
    @NamedQuery(name = "SyllabusesTemplatemainsection.findById", query = "SELECT s FROM SyllabusesTemplatemainsection s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesTemplatemainsection.findByName", query = "SELECT s FROM SyllabusesTemplatemainsection s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesTemplatemainsection.findByCreatedDate", query = "SELECT s FROM SyllabusesTemplatemainsection s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesTemplatemainsection.findByCode", query = "SELECT s FROM SyllabusesTemplatemainsection s WHERE s.code = :code"),
    @NamedQuery(name = "SyllabusesTemplatemainsection.findByPosition", query = "SELECT s FROM SyllabusesTemplatemainsection s WHERE s.position = :position")})
public class SyllabusesTemplatemainsection implements Serializable {

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
    @Column(name = "code")
    private String code;
    @Basic(optional = false)
    @Column(name = "position")
    private int position;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "mainSectionId")
    private Set<SyllabusesTemplatesubsection> syllabusesTemplatesubsectionSet;
    @JoinColumn(name = "template_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesTemplatesyllabus templateId;

    public SyllabusesTemplatemainsection() {
    }

    public SyllabusesTemplatemainsection(Long id) {
        this.id = id;
    }

    public SyllabusesTemplatemainsection(Long id, String name, Date createdDate, String code, int position) {
        this.id = id;
        this.name = name;
        this.createdDate = createdDate;
        this.code = code;
        this.position = position;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public Set<SyllabusesTemplatesubsection> getSyllabusesTemplatesubsectionSet() {
        return syllabusesTemplatesubsectionSet;
    }

    public void setSyllabusesTemplatesubsectionSet(Set<SyllabusesTemplatesubsection> syllabusesTemplatesubsectionSet) {
        this.syllabusesTemplatesubsectionSet = syllabusesTemplatesubsectionSet;
    }

    public SyllabusesTemplatesyllabus getTemplateId() {
        return templateId;
    }

    public void setTemplateId(SyllabusesTemplatesyllabus templateId) {
        this.templateId = templateId;
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
        if (!(object instanceof SyllabusesTemplatemainsection)) {
            return false;
        }
        SyllabusesTemplatemainsection other = (SyllabusesTemplatemainsection) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTemplatemainsection[ id=" + id + " ]";
    }
    
}
