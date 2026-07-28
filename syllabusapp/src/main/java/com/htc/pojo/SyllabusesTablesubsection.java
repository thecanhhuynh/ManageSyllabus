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
import jakarta.persistence.Lob;
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
@Table(name = "syllabuses_tablesubsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTablesubsection.findAll", query = "SELECT s FROM SyllabusesTablesubsection s"),
    @NamedQuery(name = "SyllabusesTablesubsection.findBySubsectionPtrId", query = "SELECT s FROM SyllabusesTablesubsection s WHERE s.subsectionPtrId = :subsectionPtrId")})
public class SyllabusesTablesubsection implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "subsection_ptr_id")
    private Long subsectionPtrId;
    @Basic(optional = false)
    @Lob
    @Column(name = "data")
    private String data;
    @JoinColumn(name = "subsection_ptr_id", referencedColumnName = "id", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private SyllabusesSubsection syllabusesSubsection;

    public SyllabusesTablesubsection() {
    }

    public SyllabusesTablesubsection(Long subsectionPtrId) {
        this.subsectionPtrId = subsectionPtrId;
    }

    public SyllabusesTablesubsection(Long subsectionPtrId, String data) {
        this.subsectionPtrId = subsectionPtrId;
        this.data = data;
    }

    public Long getSubsectionPtrId() {
        return subsectionPtrId;
    }

    public void setSubsectionPtrId(Long subsectionPtrId) {
        this.subsectionPtrId = subsectionPtrId;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
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
        if (!(object instanceof SyllabusesTablesubsection)) {
            return false;
        }
        SyllabusesTablesubsection other = (SyllabusesTablesubsection) object;
        if ((this.subsectionPtrId == null && other.subsectionPtrId != null) || (this.subsectionPtrId != null && !this.subsectionPtrId.equals(other.subsectionPtrId))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTablesubsection[ subsectionPtrId=" + subsectionPtrId + " ]";
    }
    
}
