/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.io.Serializable;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_templatetextsubsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTemplatetextsubsection.findAll", query = "SELECT s FROM SyllabusesTemplatetextsubsection s"),
    @NamedQuery(name = "SyllabusesTemplatetextsubsection.findByTemplatesubsectionPtrId", query = "SELECT s FROM SyllabusesTemplatetextsubsection s WHERE s.templatesubsectionPtrId = :templatesubsectionPtrId"),
    @NamedQuery(name = "SyllabusesTemplatetextsubsection.findByDisplayMode", query = "SELECT s FROM SyllabusesTemplatetextsubsection s WHERE s.displayMode = :displayMode"),
    @NamedQuery(name = "SyllabusesTemplatetextsubsection.findByPlaceHolder", query = "SELECT s FROM SyllabusesTemplatetextsubsection s WHERE s.placeHolder = :placeHolder")})
public class SyllabusesTemplatetextsubsection implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "templatesubsection_ptr_id")
    private Long templatesubsectionPtrId;
    @Column(name = "display_mode")
    private String displayMode;
    @Column(name = "place_holder")
    private String placeHolder;
    @JoinColumn(name = "templatesubsection_ptr_id", referencedColumnName = "id", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private SyllabusesTemplatesubsection syllabusesTemplatesubsection;

    public SyllabusesTemplatetextsubsection() {
    }

    public SyllabusesTemplatetextsubsection(Long templatesubsectionPtrId) {
        this.templatesubsectionPtrId = templatesubsectionPtrId;
    }

    public Long getTemplatesubsectionPtrId() {
        return templatesubsectionPtrId;
    }

    public void setTemplatesubsectionPtrId(Long templatesubsectionPtrId) {
        this.templatesubsectionPtrId = templatesubsectionPtrId;
    }

    public String getDisplayMode() {
        return displayMode;
    }

    public void setDisplayMode(String displayMode) {
        this.displayMode = displayMode;
    }

    public String getPlaceHolder() {
        return placeHolder;
    }

    public void setPlaceHolder(String placeHolder) {
        this.placeHolder = placeHolder;
    }

    public SyllabusesTemplatesubsection getSyllabusesTemplatesubsection() {
        return syllabusesTemplatesubsection;
    }

    public void setSyllabusesTemplatesubsection(SyllabusesTemplatesubsection syllabusesTemplatesubsection) {
        this.syllabusesTemplatesubsection = syllabusesTemplatesubsection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (templatesubsectionPtrId != null ? templatesubsectionPtrId.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof SyllabusesTemplatetextsubsection)) {
            return false;
        }
        SyllabusesTemplatetextsubsection other = (SyllabusesTemplatetextsubsection) object;
        if ((this.templatesubsectionPtrId == null && other.templatesubsectionPtrId != null) || (this.templatesubsectionPtrId != null && !this.templatesubsectionPtrId.equals(other.templatesubsectionPtrId))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTemplatetextsubsection[ templatesubsectionPtrId=" + templatesubsectionPtrId + " ]";
    }
    
}
