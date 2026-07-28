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
import java.io.Serializable;
import java.util.Set;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_attributevalue")
@NamedQueries({
    @NamedQuery(name = "SyllabusesAttributevalue.findAll", query = "SELECT s FROM SyllabusesAttributevalue s"),
    @NamedQuery(name = "SyllabusesAttributevalue.findById", query = "SELECT s FROM SyllabusesAttributevalue s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesAttributevalue.findByNameValue", query = "SELECT s FROM SyllabusesAttributevalue s WHERE s.nameValue = :nameValue")})
public class SyllabusesAttributevalue implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "name_value")
    private String nameValue;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "attributeValueId")
    private Set<SyllabusesSubsectionattributevalue> syllabusesSubsectionattributevalueSet;
    @JoinColumn(name = "attribute_group_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesAttributegroup attributeGroupId;

    public SyllabusesAttributevalue() {
    }

    public SyllabusesAttributevalue(Long id) {
        this.id = id;
    }

    public SyllabusesAttributevalue(Long id, String nameValue) {
        this.id = id;
        this.nameValue = nameValue;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNameValue() {
        return nameValue;
    }

    public void setNameValue(String nameValue) {
        this.nameValue = nameValue;
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

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof SyllabusesAttributevalue)) {
            return false;
        }
        SyllabusesAttributevalue other = (SyllabusesAttributevalue) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesAttributevalue[ id=" + id + " ]";
    }
    
}
