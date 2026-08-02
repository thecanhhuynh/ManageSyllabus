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
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
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
@Table(name = "django_migrations")
@NamedQueries({
    @NamedQuery(name = "DjangoMigrations.findAll", query = "SELECT d FROM DjangoMigrations d"),
    @NamedQuery(name = "DjangoMigrations.findById", query = "SELECT d FROM DjangoMigrations d WHERE d.id = :id"),
    @NamedQuery(name = "DjangoMigrations.findByApp", query = "SELECT d FROM DjangoMigrations d WHERE d.app = :app"),
    @NamedQuery(name = "DjangoMigrations.findByName", query = "SELECT d FROM DjangoMigrations d WHERE d.name = :name"),
    @NamedQuery(name = "DjangoMigrations.findByApplied", query = "SELECT d FROM DjangoMigrations d WHERE d.applied = :applied")})
public class DjangoMigrations implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "app")
    private String app;
    @Basic(optional = false)
    @Column(name = "name")
    private String name;
    @Basic(optional = false)
    @Column(name = "applied")
    @Temporal(TemporalType.TIMESTAMP)
    private Date applied;

    public DjangoMigrations() {
    }

    public DjangoMigrations(Long id) {
        this.id = id;
    }

    public DjangoMigrations(Long id, String app, String name, Date applied) {
        this.id = id;
        this.app = app;
        this.name = name;
        this.applied = applied;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getApp() {
        return app;
    }

    public void setApp(String app) {
        this.app = app;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getApplied() {
        return applied;
    }

    public void setApplied(Date applied) {
        this.applied = applied;
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
        if (!(object instanceof DjangoMigrations)) {
            return false;
        }
        DjangoMigrations other = (DjangoMigrations) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.DjangoMigrations[ id=" + id + " ]";
    }
    
}
