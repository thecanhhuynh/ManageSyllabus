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
@Table(name = "auth_group")
@NamedQueries({
    @NamedQuery(name = "AuthGroup.findAll", query = "SELECT a FROM AuthGroup a"),
    @NamedQuery(name = "AuthGroup.findById", query = "SELECT a FROM AuthGroup a WHERE a.id = :id"),
    @NamedQuery(name = "AuthGroup.findByName", query = "SELECT a FROM AuthGroup a WHERE a.name = :name")})
public class AuthGroup implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @Column(name = "name")
    private String name;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "groupId")
    private Set<SyllabusesUserGroups> syllabusesUserGroupsSet;

    public AuthGroup() {
    }

    public AuthGroup(Integer id) {
        this.id = id;
    }

    public AuthGroup(Integer id, String name) {
        this.id = id;
        this.name = name;
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

    public Set<SyllabusesUserGroups> getSyllabusesUserGroupsSet() {
        return syllabusesUserGroupsSet;
    }

    public void setSyllabusesUserGroupsSet(Set<SyllabusesUserGroups> syllabusesUserGroupsSet) {
        this.syllabusesUserGroupsSet = syllabusesUserGroupsSet;
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
        if (!(object instanceof AuthGroup)) {
            return false;
        }
        AuthGroup other = (AuthGroup) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.AuthGroup[ id=" + id + " ]";
    }
    
}
