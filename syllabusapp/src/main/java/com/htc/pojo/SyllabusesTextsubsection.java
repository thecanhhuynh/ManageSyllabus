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
@Table(name = "syllabuses_textsubsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTextsubsection.findAll", query = "SELECT s FROM SyllabusesTextsubsection s"),
    @NamedQuery(name = "SyllabusesTextsubsection.findBySubsectionPtrId", query = "SELECT s FROM SyllabusesTextsubsection s WHERE s.subsectionPtrId = :subsectionPtrId"),
    @NamedQuery(name = "SyllabusesTextsubsection.findByDisplayMode", query = "SELECT s FROM SyllabusesTextsubsection s WHERE s.displayMode = :displayMode"),
    @NamedQuery(name = "SyllabusesTextsubsection.findByPlaceHolder", query = "SELECT s FROM SyllabusesTextsubsection s WHERE s.placeHolder = :placeHolder")})
public class SyllabusesTextsubsection implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "subsection_ptr_id")
    private Long subsectionPtrId;
    @Lob
    @Column(name = "content")
    private String content;
    @Basic(optional = false)
    @Column(name = "display_mode")
    private String displayMode;
    @Column(name = "place_holder")
    private String placeHolder;
    @JoinColumn(name = "subsection_ptr_id", referencedColumnName = "id", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private SyllabusesSubsection syllabusesSubsection;

    public SyllabusesTextsubsection() {
    }

    public SyllabusesTextsubsection(Long subsectionPtrId) {
        this.subsectionPtrId = subsectionPtrId;
    }

    public SyllabusesTextsubsection(Long subsectionPtrId, String displayMode) {
        this.subsectionPtrId = subsectionPtrId;
        this.displayMode = displayMode;
    }

    public Long getSubsectionPtrId() {
        return subsectionPtrId;
    }

    public void setSubsectionPtrId(Long subsectionPtrId) {
        this.subsectionPtrId = subsectionPtrId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
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
        if (!(object instanceof SyllabusesTextsubsection)) {
            return false;
        }
        SyllabusesTextsubsection other = (SyllabusesTextsubsection) object;
        if ((this.subsectionPtrId == null && other.subsectionPtrId != null) || (this.subsectionPtrId != null && !this.subsectionPtrId.equals(other.subsectionPtrId))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTextsubsection[ subsectionPtrId=" + subsectionPtrId + " ]";
    }
    
}
