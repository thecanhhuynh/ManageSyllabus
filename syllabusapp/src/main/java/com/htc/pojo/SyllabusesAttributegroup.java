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
@Table(name = "syllabuses_attributegroup")
@NamedQueries({
    @NamedQuery(name = "SyllabusesAttributegroup.findAll", query = "SELECT s FROM SyllabusesAttributegroup s"),
    @NamedQuery(name = "SyllabusesAttributegroup.findById", query = "SELECT s FROM SyllabusesAttributegroup s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesAttributegroup.findByName", query = "SELECT s FROM SyllabusesAttributegroup s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesAttributegroup.findByCreatedDate", query = "SELECT s FROM SyllabusesAttributegroup s WHERE s.createdDate = :createdDate")})
public class SyllabusesAttributegroup implements Serializable {

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
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "attributeGroupId")
    private Set<SyllabusesAttributevalue> syllabusesAttributevalueSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "attributeGroupId")
    private Set<SyllabusesSelectionsubsection> syllabusesSelectionsubsectionSet;

    public SyllabusesAttributegroup() {
    }

    public SyllabusesAttributegroup(Long id) {
        this.id = id;
    }

    public SyllabusesAttributegroup(Long id, String name, Date createdDate) {
        this.id = id;
        this.name = name;
        this.createdDate = createdDate;
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

    public Set<SyllabusesAttributevalue> getSyllabusesAttributevalueSet() {
        return syllabusesAttributevalueSet;
    }

    public void setSyllabusesAttributevalueSet(Set<SyllabusesAttributevalue> syllabusesAttributevalueSet) {
        this.syllabusesAttributevalueSet = syllabusesAttributevalueSet;
    }

    public Set<SyllabusesSelectionsubsection> getSyllabusesSelectionsubsectionSet() {
        return syllabusesSelectionsubsectionSet;
    }

    public void setSyllabusesSelectionsubsectionSet(Set<SyllabusesSelectionsubsection> syllabusesSelectionsubsectionSet) {
        this.syllabusesSelectionsubsectionSet = syllabusesSelectionsubsectionSet;
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
        if (!(object instanceof SyllabusesAttributegroup)) {
            return false;
        }
        SyllabusesAttributegroup other = (SyllabusesAttributegroup) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesAttributegroup[ id=" + id + " ]";
    }
    
}
