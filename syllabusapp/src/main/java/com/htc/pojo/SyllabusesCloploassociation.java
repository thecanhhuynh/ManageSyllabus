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
@Table(name = "syllabuses_cloploassociation")
@NamedQueries({
    @NamedQuery(name = "SyllabusesCloploassociation.findAll", query = "SELECT s FROM SyllabusesCloploassociation s"),
    @NamedQuery(name = "SyllabusesCloploassociation.findById", query = "SELECT s FROM SyllabusesCloploassociation s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesCloploassociation.findByRating", query = "SELECT s FROM SyllabusesCloploassociation s WHERE s.rating = :rating")})
public class SyllabusesCloploassociation implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "rating")
    private int rating;
    @JoinColumn(name = "clo_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesCourselearningoutcome cloId;
    @JoinColumn(name = "plo_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesProgrammelearningoutcome ploId;

    public SyllabusesCloploassociation() {
    }

    public SyllabusesCloploassociation(Long id) {
        this.id = id;
    }

    public SyllabusesCloploassociation(Long id, int rating) {
        this.id = id;
        this.rating = rating;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public SyllabusesCourselearningoutcome getCloId() {
        return cloId;
    }

    public void setCloId(SyllabusesCourselearningoutcome cloId) {
        this.cloId = cloId;
    }

    public SyllabusesProgrammelearningoutcome getPloId() {
        return ploId;
    }

    public void setPloId(SyllabusesProgrammelearningoutcome ploId) {
        this.ploId = ploId;
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
        if (!(object instanceof SyllabusesCloploassociation)) {
            return false;
        }
        SyllabusesCloploassociation other = (SyllabusesCloploassociation) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesCloploassociation[ id=" + id + " ]";
    }
    
}
