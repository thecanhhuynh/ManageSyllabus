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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.io.Serializable;
import java.util.Date;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_subsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesSubsection.findAll", query = "SELECT s FROM SyllabusesSubsection s"),
    @NamedQuery(name = "SyllabusesSubsection.findById", query = "SELECT s FROM SyllabusesSubsection s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesSubsection.findByName", query = "SELECT s FROM SyllabusesSubsection s WHERE s.name = :name"),
    @NamedQuery(name = "SyllabusesSubsection.findByCreatedDate", query = "SELECT s FROM SyllabusesSubsection s WHERE s.createdDate = :createdDate"),
    @NamedQuery(name = "SyllabusesSubsection.findByPosition", query = "SELECT s FROM SyllabusesSubsection s WHERE s.position = :position"),
    @NamedQuery(name = "SyllabusesSubsection.findByType", query = "SELECT s FROM SyllabusesSubsection s WHERE s.type = :type"),
    @NamedQuery(name = "SyllabusesSubsection.findByCode", query = "SELECT s FROM SyllabusesSubsection s WHERE s.code = :code")})
public class SyllabusesSubsection implements Serializable {

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
    @Column(name = "position")
    private int position;
    @Basic(optional = false)
    @Column(name = "type")
    private String type;
    @Basic(optional = false)
    @Column(name = "code")
    private String code;
    @JoinColumn(name = "main_section_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesMainsection mainSectionId;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "syllabusesSubsection")
    private SyllabusesReferencesubsection syllabusesReferencesubsection;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "syllabusesSubsection")
    private SyllabusesSelectionsubsection syllabusesSelectionsubsection;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "syllabusesSubsection")
    private SyllabusesTablesubsection syllabusesTablesubsection;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "syllabusesSubsection")
    private SyllabusesTextsubsection syllabusesTextsubsection;

    public SyllabusesSubsection() {
    }

    public SyllabusesSubsection(Long id) {
        this.id = id;
    }

    public SyllabusesSubsection(Long id, String name, Date createdDate, int position, String type, String code) {
        this.id = id;
        this.name = name;
        this.createdDate = createdDate;
        this.position = position;
        this.type = type;
        this.code = code;
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

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public SyllabusesMainsection getMainSectionId() {
        return mainSectionId;
    }

    public void setMainSectionId(SyllabusesMainsection mainSectionId) {
        this.mainSectionId = mainSectionId;
    }

    public SyllabusesReferencesubsection getSyllabusesReferencesubsection() {
        return syllabusesReferencesubsection;
    }

    public void setSyllabusesReferencesubsection(SyllabusesReferencesubsection syllabusesReferencesubsection) {
        this.syllabusesReferencesubsection = syllabusesReferencesubsection;
    }

    public SyllabusesSelectionsubsection getSyllabusesSelectionsubsection() {
        return syllabusesSelectionsubsection;
    }

    public void setSyllabusesSelectionsubsection(SyllabusesSelectionsubsection syllabusesSelectionsubsection) {
        this.syllabusesSelectionsubsection = syllabusesSelectionsubsection;
    }

    public SyllabusesTablesubsection getSyllabusesTablesubsection() {
        return syllabusesTablesubsection;
    }

    public void setSyllabusesTablesubsection(SyllabusesTablesubsection syllabusesTablesubsection) {
        this.syllabusesTablesubsection = syllabusesTablesubsection;
    }

    public SyllabusesTextsubsection getSyllabusesTextsubsection() {
        return syllabusesTextsubsection;
    }

    public void setSyllabusesTextsubsection(SyllabusesTextsubsection syllabusesTextsubsection) {
        this.syllabusesTextsubsection = syllabusesTextsubsection;
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
        if (!(object instanceof SyllabusesSubsection)) {
            return false;
        }
        SyllabusesSubsection other = (SyllabusesSubsection) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesSubsection[ id=" + id + " ]";
    }
    
}
