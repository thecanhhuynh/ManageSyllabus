/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import java.io.Serializable;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_subsectionattributevalue")
@NamedQueries({
    @NamedQuery(name = "SyllabusesSubsectionattributevalue.findAll", query = "SELECT s FROM SyllabusesSubsectionattributevalue s"),
    @NamedQuery(name = "SyllabusesSubsectionattributevalue.findById", query = "SELECT s FROM SyllabusesSubsectionattributevalue s WHERE s.id = :id")})
public class SyllabusesSubsectionattributevalue implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @JoinColumn(name = "attribute_value_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesAttributevalue attributeValueId;
    @JoinColumn(name = "subsection_id", referencedColumnName = "subsection_ptr_id")
    @ManyToOne(optional = false)
    private SyllabusesSelectionsubsection subsectionId;

    public SyllabusesSubsectionattributevalue() {
    }

    public SyllabusesSubsectionattributevalue(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SyllabusesAttributevalue getAttributeValueId() {
        return attributeValueId;
    }

    public void setAttributeValueId(SyllabusesAttributevalue attributeValueId) {
        this.attributeValueId = attributeValueId;
    }

    public SyllabusesSelectionsubsection getSubsectionId() {
        return subsectionId;
    }

    public void setSubsectionId(SyllabusesSelectionsubsection subsectionId) {
        this.subsectionId = subsectionId;
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
        if (!(object instanceof SyllabusesSubsectionattributevalue)) {
            return false;
        }
        SyllabusesSubsectionattributevalue other = (SyllabusesSubsectionattributevalue) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesSubsectionattributevalue[ id=" + id + " ]";
    }
    
}
