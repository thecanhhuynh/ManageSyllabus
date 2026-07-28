/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Set;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_selectionsubsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesSelectionsubsection.findAll", query = "SELECT s FROM SyllabusesSelectionsubsection s"),
    @NamedQuery(name = "SyllabusesSelectionsubsection.findBySubsectionPtrId", query = "SELECT s FROM SyllabusesSelectionsubsection s WHERE s.subsectionPtrId = :subsectionPtrId")})
public class SyllabusesSelectionsubsection implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "subsection_ptr_id")
    private Long subsectionPtrId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "subsectionId")
    private Set<SyllabusesSubsectionattributevalue> syllabusesSubsectionattributevalueSet;
    @JoinColumn(name = "attribute_group_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesAttributegroup attributeGroupId;
    @JoinColumn(name = "subsection_ptr_id", referencedColumnName = "id", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private SyllabusesSubsection syllabusesSubsection;

    public SyllabusesSelectionsubsection() {
    }

    public SyllabusesSelectionsubsection(Long subsectionPtrId) {
        this.subsectionPtrId = subsectionPtrId;
    }

    public Long getSubsectionPtrId() {
        return subsectionPtrId;
    }

    public void setSubsectionPtrId(Long subsectionPtrId) {
        this.subsectionPtrId = subsectionPtrId;
    }

    public Set<SyllabusesSubsectionattributevalue> getSyllabusesSubsectionattributevalueSet() {
        return syllabusesSubsectionattributevalueSet;
    }

    public void setSyllabusesSubsectionattributevalueSet(Set<SyllabusesSubsectionattributevalue> syllabusesSubsectionattributevalueSet) {
        this.syllabusesSubsectionattributevalueSet = syllabusesSubsectionattributevalueSet;
    }

    public SyllabusesAttributegroup getAttributeGroupId() {
        return attributeGroupId;
    }

    public void setAttributeGroupId(SyllabusesAttributegroup attributeGroupId) {
        this.attributeGroupId = attributeGroupId;
    }

    public SyllabusesSubsection getSyllabusesSubsection() {
        return syllabusesSubsection;
    }

    public void setSyllabusesSubsection(SyllabusesSubsection syllabusesSubsection) {
        this.syllabusesSubsection = syllabusesSubsection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (subsectionPtrId != null ? subsectionPtrId.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof SyllabusesSelectionsubsection)) {
            return false;
        }
        SyllabusesSelectionsubsection other = (SyllabusesSelectionsubsection) object;
        if ((this.subsectionPtrId == null && other.subsectionPtrId != null) || (this.subsectionPtrId != null && !this.subsectionPtrId.equals(other.subsectionPtrId))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesSelectionsubsection[ subsectionPtrId=" + subsectionPtrId + " ]";
    }
    
}
