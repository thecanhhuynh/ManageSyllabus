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
@Table(name = "syllabuses_user_user_permissions")
@NamedQueries({
    @NamedQuery(name = "SyllabusesUserUserPermissions.findAll", query = "SELECT s FROM SyllabusesUserUserPermissions s"),
    @NamedQuery(name = "SyllabusesUserUserPermissions.findById", query = "SELECT s FROM SyllabusesUserUserPermissions s WHERE s.id = :id")})
public class SyllabusesUserUserPermissions implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @JoinColumn(name = "permission_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private AuthPermission permissionId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesUser userId;

    public SyllabusesUserUserPermissions() {
    }

    public SyllabusesUserUserPermissions(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AuthPermission getPermissionId() {
        return permissionId;
    }

    public void setPermissionId(AuthPermission permissionId) {
        this.permissionId = permissionId;
    }

    public SyllabusesUser getUserId() {
        return userId;
    }

    public void setUserId(SyllabusesUser userId) {
        this.userId = userId;
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
        if (!(object instanceof SyllabusesUserUserPermissions)) {
            return false;
        }
        SyllabusesUserUserPermissions other = (SyllabusesUserUserPermissions) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesUserUserPermissions[ id=" + id + " ]";
    }
    
}
