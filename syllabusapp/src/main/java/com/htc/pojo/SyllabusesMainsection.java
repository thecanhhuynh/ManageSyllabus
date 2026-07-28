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
@Table(name = "syllabuses_mainsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesMainsection.findAll", query = "SELECT s FROM SyllabusesMainsection s"),
    @NamedQuery(name = "SyllabusesMainsection.findById", query = "SELECT s FROM SyllabusesMainsection s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesMainsection.findByName", query = "SELECT s FROM SyllabusesMainsection s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesMainsection.findByCreatedDate", query = "SELECT s FROM SyllabusesMainsection s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesMainsection.findByCode", query = "SELECT s FROM SyllabusesMainsection s WHERE s.code = :code"),
    @NamedQuery(name = "SyllabusesMainsection.findByPosition", query = "SELECT s FROM SyllabusesMainsection s WHERE s.position = :position")})
public class SyllabusesMainsection implements Serializable {

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
    @Column(name = "code")
    private String code;
    @Basic(optional = false)
    @Column(name = "position")
    private int position;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "mainSectionId")
    private Set<SyllabusesSubsection> syllabusesSubsectionSet;
    @JoinColumn(name = "syllabus_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesSyllabus syllabusId;

    public SyllabusesMainsection() {
    }

    public SyllabusesMainsection(Long id) {
        this.id = id;
    }

    public SyllabusesMainsection(Long id, String name, Date createdDate, String code, int position) {
        this.id = id;
        this.name = name;
        this.createdDate = createdDate;
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

    public Set<SyllabusesSubsection> getSyllabusesSubsectionSet() {
        return syllabusesSubsectionSet;
    }

    public void setSyllabusesSubsectionSet(Set<SyllabusesSubsection> syllabusesSubsectionSet) {
        this.syllabusesSubsectionSet = syllabusesSubsectionSet;
    }

    public SyllabusesSyllabus getSyllabusId() {
        return syllabusId;
    }

    public void setSyllabusId(SyllabusesSyllabus syllabusId) {
        this.syllabusId = syllabusId;
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
        if (!(object instanceof SyllabusesMainsection)) {
            return false;
        }
        SyllabusesMainsection other = (SyllabusesMainsection) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesMainsection[ id=" + id + " ]";
    }
    
}
