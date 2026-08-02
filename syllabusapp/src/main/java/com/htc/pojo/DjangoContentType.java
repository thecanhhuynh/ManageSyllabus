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
import java.io.Serializable;
import java.util.Set;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "django_content_type")
@NamedQueries({
    @NamedQuery(name = "DjangoContentType.findAll", query = "SELECT d FROM DjangoContentType d"),
    @NamedQuery(name = "DjangoContentType.findById", query = "SELECT d FROM DjangoContentType d WHERE d.id = :id"),
    @NamedQuery(name = "DjangoContentType.findByAppLabel", query = "SELECT d FROM DjangoContentType d WHERE d.appLabel = :appLabel"),
    @NamedQuery(name = "DjangoContentType.findByModel", query = "SELECT d FROM DjangoContentType d WHERE d.model = :model")})
public class DjangoContentType implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @Column(name = "app_label")
    private String appLabel;
    @Basic(optional = false)
    @Column(name = "model")
    private String model;
    @OneToMany(mappedBy = "contentTypeId")
    private Set<DjangoAdminLog> djangoAdminLogSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "contentTypeId")
    private Set<AuthPermission> authPermissionSet;

    public DjangoContentType() {
    }

    public DjangoContentType(Integer id) {
        this.id = id;
    }

    public DjangoContentType(Integer id, String appLabel, String model) {
        this.id = id;
        this.appLabel = appLabel;
        this.model = model;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getAppLabel() {
        return appLabel;
    }

    public void setAppLabel(String appLabel) {
        this.appLabel = appLabel;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Set<DjangoAdminLog> getDjangoAdminLogSet() {
        return djangoAdminLogSet;
    }

    public void setDjangoAdminLogSet(Set<DjangoAdminLog> djangoAdminLogSet) {
        this.djangoAdminLogSet = djangoAdminLogSet;
    }

    public Set<AuthPermission> getAuthPermissionSet() {
        return authPermissionSet;
    }

    public void setAuthPermissionSet(Set<AuthPermission> authPermissionSet) {
        this.authPermissionSet = authPermissionSet;
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
        if (!(object instanceof DjangoContentType)) {
            return false;
        }
        DjangoContentType other = (DjangoContentType) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.DjangoContentType[ id=" + id + " ]";
    }
    
}
