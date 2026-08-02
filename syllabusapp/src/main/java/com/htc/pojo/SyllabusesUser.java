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
import jakarta.persistence.OneToOne;
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
@Table(name = "syllabuses_user")
@NamedQueries({
    @NamedQuery(name = "SyllabusesUser.findAll", query = "SELECT s FROM SyllabusesUser s"),
    @NamedQuery(name = "SyllabusesUser.findById", query = "SELECT s FROM SyllabusesUser s WHERE s.id = :id"),
    @NamedQuery(name = "SyllabusesUser.findByPassword", query = "SELECT s FROM SyllabusesUser s WHERE s.password = :password"),
    @NamedQuery(name = "SyllabusesUser.findByLastLogin", query = "SELECT s FROM SyllabusesUser s WHERE s.lastLogin = :lastLogin"),
    @NamedQuery(name = "SyllabusesUser.findByIsSuperuser", query = "SELECT s FROM SyllabusesUser s WHERE s.isSuperuser = :isSuperuser"),
    @NamedQuery(name = "SyllabusesUser.findByUsername", query = "SELECT s FROM SyllabusesUser s WHERE s.username = :username"),
    @NamedQuery(name = "SyllabusesUser.findByFirstName", query = "SELECT s FROM SyllabusesUser s WHERE s.firstName = :firstName"),
    @NamedQuery(name = "SyllabusesUser.findByLastName", query = "SELECT s FROM SyllabusesUser s WHERE s.lastName = :lastName"),
    @NamedQuery(name = "SyllabusesUser.findByEmail", query = "SELECT s FROM SyllabusesUser s WHERE s.email = :email"),
    @NamedQuery(name = "SyllabusesUser.findByIsStaff", query = "SELECT s FROM SyllabusesUser s WHERE s.isStaff = :isStaff"),
    @NamedQuery(name = "SyllabusesUser.findByIsActive", query = "SELECT s FROM SyllabusesUser s WHERE s.isActive = :isActive"),
    @NamedQuery(name = "SyllabusesUser.findByDateJoined", query = "SELECT s FROM SyllabusesUser s WHERE s.dateJoined = :dateJoined"),
    @NamedQuery(name = "SyllabusesUser.findByActive", query = "SELECT s FROM SyllabusesUser s WHERE s.active = :active"),
    @NamedQuery(name = "SyllabusesUser.findByJoinedDate", query = "SELECT s FROM SyllabusesUser s WHERE s.joinedDate = :joinedDate"),
    @NamedQuery(name = "SyllabusesUser.findByAvatar", query = "SELECT s FROM SyllabusesUser s WHERE s.avatar = :avatar"),
    @NamedQuery(name = "SyllabusesUser.findByUserRole", query = "SELECT s FROM SyllabusesUser s WHERE s.userRole = :userRole")})
public class SyllabusesUser implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "password")
    private String password;
    @Column(name = "last_login")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastLogin;
    @Basic(optional = false)
    @Column(name = "is_superuser")
    private boolean isSuperuser;
    @Basic(optional = false)
    @Column(name = "username")
    private String username;
    @Basic(optional = false)
    @Column(name = "first_name")
    private String firstName;
    @Basic(optional = false)
    @Column(name = "last_name")
    private String lastName;
    @Basic(optional = false)
    @Column(name = "email")
    private String email;
    @Basic(optional = false)
    @Column(name = "is_staff")
    private boolean isStaff;
    @Basic(optional = false)
    @Column(name = "is_active")
    private boolean isActive;
    @Basic(optional = false)
    @Column(name = "date_joined")
    @Temporal(TemporalType.TIMESTAMP)
    private Date dateJoined;
    @Basic(optional = false)
    @Column(name = "active")
    private boolean active;
    @Basic(optional = false)
    @Column(name = "joined_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date joinedDate;
    @Column(name = "avatar")
    private String avatar;
    @Basic(optional = false)
    @Column(name = "user_role")
    private String userRole;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Set<Oauth2ProviderGrant> oauth2ProviderGrantSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Set<DjangoAdminLog> djangoAdminLogSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Set<SyllabusesUserGroups> syllabusesUserGroupsSet;
    @OneToMany(mappedBy = "userId")
    private Set<Oauth2ProviderIdtoken> oauth2ProviderIdtokenSet;
    @OneToMany(mappedBy = "userId")
    private Set<Oauth2ProviderApplication> oauth2ProviderApplicationSet;
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "userId")
    private SyllabusesLecturer syllabusesLecturer;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Set<Oauth2ProviderRefreshtoken> oauth2ProviderRefreshtokenSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Set<SyllabusesUserUserPermissions> syllabusesUserUserPermissionsSet;
    @OneToMany(mappedBy = "userId")
    private Set<Oauth2ProviderAccesstoken> oauth2ProviderAccesstokenSet;

    public SyllabusesUser() {
    }

    public SyllabusesUser(Long id) {
        this.id = id;
    }

    public SyllabusesUser(Long id, String password, boolean isSuperuser, String username, String firstName, String lastName, String email, boolean isStaff, boolean isActive, Date dateJoined, boolean active, Date joinedDate, String userRole) {
        this.id = id;
        this.password = password;
        this.isSuperuser = isSuperuser;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.isStaff = isStaff;
        this.isActive = isActive;
        this.dateJoined = dateJoined;
        this.active = active;
        this.joinedDate = joinedDate;
        this.userRole = userRole;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Date getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(Date lastLogin) {
        this.lastLogin = lastLogin;
    }

    public boolean getIsSuperuser() {
        return isSuperuser;
    }

    public void setIsSuperuser(boolean isSuperuser) {
        this.isSuperuser = isSuperuser;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean getIsStaff() {
        return isStaff;
    }

    public void setIsStaff(boolean isStaff) {
        this.isStaff = isStaff;
    }

    public boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }

    public Date getDateJoined() {
        return dateJoined;
    }

    public void setDateJoined(Date dateJoined) {
        this.dateJoined = dateJoined;
    }

    public boolean getActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Date getJoinedDate() {
        return joinedDate;
    }

    public void setJoinedDate(Date joinedDate) {
        this.joinedDate = joinedDate;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public Set<Oauth2ProviderGrant> getOauth2ProviderGrantSet() {
        return oauth2ProviderGrantSet;
    }

    public void setOauth2ProviderGrantSet(Set<Oauth2ProviderGrant> oauth2ProviderGrantSet) {
        this.oauth2ProviderGrantSet = oauth2ProviderGrantSet;
    }

    public Set<DjangoAdminLog> getDjangoAdminLogSet() {
        return djangoAdminLogSet;
    }

    public void setDjangoAdminLogSet(Set<DjangoAdminLog> djangoAdminLogSet) {
        this.djangoAdminLogSet = djangoAdminLogSet;
    }

    public Set<SyllabusesUserGroups> getSyllabusesUserGroupsSet() {
        return syllabusesUserGroupsSet;
    }

    public void setSyllabusesUserGroupsSet(Set<SyllabusesUserGroups> syllabusesUserGroupsSet) {
        this.syllabusesUserGroupsSet = syllabusesUserGroupsSet;
    }

    public Set<Oauth2ProviderIdtoken> getOauth2ProviderIdtokenSet() {
        return oauth2ProviderIdtokenSet;
    }

    public void setOauth2ProviderIdtokenSet(Set<Oauth2ProviderIdtoken> oauth2ProviderIdtokenSet) {
        this.oauth2ProviderIdtokenSet = oauth2ProviderIdtokenSet;
    }

    public Set<Oauth2ProviderApplication> getOauth2ProviderApplicationSet() {
        return oauth2ProviderApplicationSet;
    }

    public void setOauth2ProviderApplicationSet(Set<Oauth2ProviderApplication> oauth2ProviderApplicationSet) {
        this.oauth2ProviderApplicationSet = oauth2ProviderApplicationSet;
    }

    public SyllabusesLecturer getSyllabusesLecturer() {
        return syllabusesLecturer;
    }

    public void setSyllabusesLecturer(SyllabusesLecturer syllabusesLecturer) {
        this.syllabusesLecturer = syllabusesLecturer;
    }

    public Set<Oauth2ProviderRefreshtoken> getOauth2ProviderRefreshtokenSet() {
        return oauth2ProviderRefreshtokenSet;
    }

    public void setOauth2ProviderRefreshtokenSet(Set<Oauth2ProviderRefreshtoken> oauth2ProviderRefreshtokenSet) {
        this.oauth2ProviderRefreshtokenSet = oauth2ProviderRefreshtokenSet;
    }

    public Set<SyllabusesUserUserPermissions> getSyllabusesUserUserPermissionsSet() {
        return syllabusesUserUserPermissionsSet;
    }

    public void setSyllabusesUserUserPermissionsSet(Set<SyllabusesUserUserPermissions> syllabusesUserUserPermissionsSet) {
        this.syllabusesUserUserPermissionsSet = syllabusesUserUserPermissionsSet;
    }

    public Set<Oauth2ProviderAccesstoken> getOauth2ProviderAccesstokenSet() {
        return oauth2ProviderAccesstokenSet;
    }

    public void setOauth2ProviderAccesstokenSet(Set<Oauth2ProviderAccesstoken> oauth2ProviderAccesstokenSet) {
        this.oauth2ProviderAccesstokenSet = oauth2ProviderAccesstokenSet;
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
        if (!(object instanceof SyllabusesUser)) {
            return false;
        }
        SyllabusesUser other = (SyllabusesUser) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesUser[ id=" + id + " ]";
    }
    
}
