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
@Table(name = "auth_permission")
@NamedQueries({
    @NamedQuery(name = "AuthPermission.findAll", query = "SELECT a FROM AuthPermission a"),
    @NamedQuery(name = "AuthPermission.findById", query = "SELECT a FROM AuthPermission a WHERE a.id = :id"),
    @NamedQuery(name = "AuthPermission.findByName", query = "SELECT a FROM AuthPermission a WHERE a.name = :name"),
    @NamedQuery(name = "AuthPermission.findByCodename", query = "SELECT a FROM AuthPermission a WHERE a.codename = :codename")})
public class AuthPermission implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @Column(name = "name")
    private String name;
    @Basic(optional = false)
    @Column(name = "codename")
    private String codename;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "permissionId")
    private Set<AuthGroupPermissions> authGroupPermissionsSet;
    @JoinColumn(name = "content_type_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private DjangoContentType contentTypeId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "permissionId")
    private Set<SyllabusesUserUserPermissions> syllabusesUserUserPermissionsSet;

    public AuthPermission() {
    }

    public AuthPermission(Integer id) {
        this.id = id;
    }

    public AuthPermission(Integer id, String name, String codename) {
        this.id = id;
        this.name = name;
        this.codename = codename;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCodename() {
        return codename;
    }

    public void setCodename(String codename) {
        this.codename = codename;
    }

    public Set<AuthGroupPermissions> getAuthGroupPermissionsSet() {
        return authGroupPermissionsSet;
    }

    public void setAuthGroupPermissionsSet(Set<AuthGroupPermissions> authGroupPermissionsSet) {
        this.authGroupPermissionsSet = authGroupPermissionsSet;
    }

    public DjangoContentType getContentTypeId() {
        return contentTypeId;
    }

    public void setContentTypeId(DjangoContentType contentTypeId) {
        this.contentTypeId = contentTypeId;
    }

    public Set<SyllabusesUserUserPermissions> getSyllabusesUserUserPermissionsSet() {
        return syllabusesUserUserPermissionsSet;
    }

    public void setSyllabusesUserUserPermissionsSet(Set<SyllabusesUserUserPermissions> syllabusesUserUserPermissionsSet) {
        this.syllabusesUserUserPermissionsSet = syllabusesUserUserPermissionsSet;
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
        if (!(object instanceof AuthPermission)) {
            return false;
        }
        AuthPermission other = (AuthPermission) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.AuthPermission[ id=" + id + " ]";
    }
    
}
