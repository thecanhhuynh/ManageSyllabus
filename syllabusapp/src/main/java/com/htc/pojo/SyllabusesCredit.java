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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.io.Serializable;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_credit")
@NamedQueries({
    @NamedQuery(name = "SyllabusesCredit.findAll", query = "SELECT s FROM SyllabusesCredit s"),
    @NamedQuery(name = "SyllabusesCredit.findById", query = "SELECT s FROM SyllabusesCredit s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesCredit.findByNumberTheory", query = "SELECT s FROM SyllabusesCredit s WHERE s.numberTheory = :numberTheory"),
    @NamedQuery(name = "SyllabusesCredit.findByNumberPractice", query = "SELECT s FROM SyllabusesCredit s WHERE s.numberPractice = :numberPractice"),
    @NamedQuery(name = "SyllabusesCredit.findByHourSelfStudy", query = "SELECT s FROM SyllabusesCredit s WHERE s.hourSelfStudy = :hourSelfStudy")})
public class SyllabusesCredit implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "number_theory")
    private int numberTheory;
    @Basic(optional = false)
    @Column(name = "number_practice")
    private int numberPractice;
    @Basic(optional = false)
    @Column(name = "hour_self_study")
    private int hourSelfStudy;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "creditId")
    private SyllabusesSubject syllabusesSubject;

    public SyllabusesCredit() {
    }

    public SyllabusesCredit(Long id) {
        this.id = id;
    }

    public SyllabusesCredit(Long id, int numberTheory, int numberPractice, int hourSelfStudy) {
        this.id = id;
        this.numberTheory = numberTheory;
        this.numberPractice = numberPractice;
        this.hourSelfStudy = hourSelfStudy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getNumberTheory() {
        return numberTheory;
    }

    public void setNumberTheory(int numberTheory) {
        this.numberTheory = numberTheory;
    }

    public int getNumberPractice() {
        return numberPractice;
    }

    public void setNumberPractice(int numberPractice) {
        this.numberPractice = numberPractice;
    }

    public int getHourSelfStudy() {
        return hourSelfStudy;
    }

    public void setHourSelfStudy(int hourSelfStudy) {
        this.hourSelfStudy = hourSelfStudy;
    }

    public SyllabusesSubject getSyllabusesSubject() {
        return syllabusesSubject;
    }

    public void setSyllabusesSubject(SyllabusesSubject syllabusesSubject) {
        this.syllabusesSubject = syllabusesSubject;
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
        if (!(object instanceof SyllabusesCredit)) {
            return false;
        }
        SyllabusesCredit other = (SyllabusesCredit) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesCredit[ id=" + id + " ]";
    }
    
}
