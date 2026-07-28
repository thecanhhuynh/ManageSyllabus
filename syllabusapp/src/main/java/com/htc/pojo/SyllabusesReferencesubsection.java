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
@Table(name = "syllabuses_referencesubsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesReferencesubsection.findAll", query = "SELECT s FROM SyllabusesReferencesubsection s"),
    @NamedQuery(name = "SyllabusesReferencesubsection.findBySubsectionPtrId", query = "SELECT s FROM SyllabusesReferencesubsection s WHERE s.subsectionPtrId = :subsectionPtrId"),
    @NamedQuery(name = "SyllabusesReferencesubsection.findByReferenceCode", query = "SELECT s FROM SyllabusesReferencesubsection s WHERE s.referenceCode = :referenceCode")})
public class SyllabusesReferencesubsection implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "subsection_ptr_id")
    private Long subsectionPtrId;
    @Basic(optional = false)
    @Column(name = "reference_code")
    private String referenceCode;
    @JoinColumn(name = "subsection_ptr_id", referencedColumnName = "id", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private SyllabusesSubsection syllabusesSubsection;

    public SyllabusesReferencesubsection() {
    }

    public SyllabusesReferencesubsection(Long subsectionPtrId) {
        this.subsectionPtrId = subsectionPtrId;
    }

    public SyllabusesReferencesubsection(Long subsectionPtrId, String referenceCode) {
        this.subsectionPtrId = subsectionPtrId;
        this.referenceCode = referenceCode;
    }

    public Long getSubsectionPtrId() {
        return subsectionPtrId;
    }

    public void setSubsectionPtrId(Long subsectionPtrId) {
        this.subsectionPtrId = subsectionPtrId;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public void setReferenceCode(String referenceCode) {
        this.referenceCode = referenceCode;
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
        if (!(object instanceof SyllabusesReferencesubsection)) {
            return false;
        }
        SyllabusesReferencesubsection other = (SyllabusesReferencesubsection) object;
        if ((this.subsectionPtrId == null && other.subsectionPtrId != null) || (this.subsectionPtrId != null && !this.subsectionPtrId.equals(other.subsectionPtrId))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesReferencesubsection[ subsectionPtrId=" + subsectionPtrId + " ]";
    }
    
}
