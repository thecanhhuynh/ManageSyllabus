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
@Table(name = "syllabuses_typelearningmaterial")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTypelearningmaterial.findAll", query = "SELECT s FROM SyllabusesTypelearningmaterial s"),
    @NamedQuery(name = "SyllabusesTypelearningmaterial.findById", query = "SELECT s FROM SyllabusesTypelearningmaterial s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesTypelearningmaterial.findByCreatedDate", query = "SELECT s FROM SyllabusesTypelearningmaterial s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesTypelearningmaterial.findByName", query = "SELECT s FROM SyllabusesTypelearningmaterial s WHERE s.name = :name")})
public class SyllabusesTypelearningmaterial implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "created_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;
    @Basic(optional = false)
    @Column(name = "name")
    private String name;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "typeMaterialId")
    private Set<SyllabusesSyllabuslearningmaterial> syllabusesSyllabuslearningmaterialSet;

    public SyllabusesTypelearningmaterial() {
    }

    public SyllabusesTypelearningmaterial(Long id) {
        this.id = id;
    }

    public SyllabusesTypelearningmaterial(Long id, Date createdDate, String name) {
        this.id = id;
        this.createdDate = createdDate;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<SyllabusesSyllabuslearningmaterial> getSyllabusesSyllabuslearningmaterialSet() {
        return syllabusesSyllabuslearningmaterialSet;
    }

    public void setSyllabusesSyllabuslearningmaterialSet(Set<SyllabusesSyllabuslearningmaterial> syllabusesSyllabuslearningmaterialSet) {
        this.syllabusesSyllabuslearningmaterialSet = syllabusesSyllabuslearningmaterialSet;
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
        if (!(object instanceof SyllabusesTypelearningmaterial)) {
            return false;
        }
        SyllabusesTypelearningmaterial other = (SyllabusesTypelearningmaterial) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTypelearningmaterial[ id=" + id + " ]";
    }
    
}
