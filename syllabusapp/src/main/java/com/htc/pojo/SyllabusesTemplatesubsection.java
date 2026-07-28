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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.io.Serializable;
import java.util.Date;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_templatesubsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTemplatesubsection.findAll", query = "SELECT s FROM SyllabusesTemplatesubsection s"),
    @NamedQuery(name = "SyllabusesTemplatesubsection.findById", query = "SELECT s FROM SyllabusesTemplatesubsection s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesTemplatesubsection.findByName", query = "SELECT s FROM SyllabusesTemplatesubsection s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesTemplatesubsection.findByCreatedDate", query = "SELECT s FROM SyllabusesTemplatesubsection s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesTemplatesubsection.findByType", query = "SELECT s FROM SyllabusesTemplatesubsection s WHERE s.type = :type"),
    @NamedQuery(name = "SyllabusesTemplatesubsection.findByCode", query = "SELECT s FROM SyllabusesTemplatesubsection s WHERE s.code = :code"),
    @NamedQuery(name = "SyllabusesTemplatesubsection.findByPosition", query = "SELECT s FROM SyllabusesTemplatesubsection s WHERE s.position = :position")})
public class SyllabusesTemplatesubsection implements Serializable {

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
    @Column(name = "type")
    private String type;
    @Basic(optional = false)
    @Column(name = "code")
    private String code;
    @Basic(optional = false)
    @Column(name = "position")
    private int position;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "syllabusesTemplatesubsection")
    private SyllabusesTemplatetablesubsection syllabusesTemplatetablesubsection;
    @JoinColumn(name = "main_section_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesTemplatemainsection mainSectionId;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "syllabusesTemplatesubsection")
    private SyllabusesTemplatetextsubsection syllabusesTemplatetextsubsection;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "syllabusesTemplatesubsection")
    private SyllabusesTemplateselectionsubsection syllabusesTemplateselectionsubsection;

    public SyllabusesTemplatesubsection() {
    }

    public SyllabusesTemplatesubsection(Long id) {
        this.id = id;
    }

    public SyllabusesTemplatesubsection(Long id, String name, Date createdDate, String type, String code, int position) {
        this.id = id;
        this.name = name;
        this.createdDate = createdDate;
        this.type = type;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public SyllabusesTemplatetablesubsection getSyllabusesTemplatetablesubsection() {
        return syllabusesTemplatetablesubsection;
    }

    public void setSyllabusesTemplatetablesubsection(SyllabusesTemplatetablesubsection syllabusesTemplatetablesubsection) {
        this.syllabusesTemplatetablesubsection = syllabusesTemplatetablesubsection;
    }

    public SyllabusesTemplatemainsection getMainSectionId() {
        return mainSectionId;
    }

    public void setMainSectionId(SyllabusesTemplatemainsection mainSectionId) {
        this.mainSectionId = mainSectionId;
    }

    public SyllabusesTemplatetextsubsection getSyllabusesTemplatetextsubsection() {
        return syllabusesTemplatetextsubsection;
    }

    public void setSyllabusesTemplatetextsubsection(SyllabusesTemplatetextsubsection syllabusesTemplatetextsubsection) {
        this.syllabusesTemplatetextsubsection = syllabusesTemplatetextsubsection;
    }

    public SyllabusesTemplateselectionsubsection getSyllabusesTemplateselectionsubsection() {
        return syllabusesTemplateselectionsubsection;
    }

    public void setSyllabusesTemplateselectionsubsection(SyllabusesTemplateselectionsubsection syllabusesTemplateselectionsubsection) {
        this.syllabusesTemplateselectionsubsection = syllabusesTemplateselectionsubsection;
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
        if (!(object instanceof SyllabusesTemplatesubsection)) {
            return false;
        }
        SyllabusesTemplatesubsection other = (SyllabusesTemplatesubsection) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTemplatesubsection[ id=" + id + " ]";
    }
    
}
