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
@Table(name = "oauth2_provider_refreshtoken")
@NamedQueries({
    @NamedQuery(name = "Oauth2ProviderRefreshtoken.findAll", query = "SELECT o FROM Oauth2ProviderRefreshtoken o"),
    @NamedQuery(name = "Oauth2ProviderRefreshtoken.findById", query = "SELECT o FROM Oauth2ProviderRefreshtoken o WHERE o.id = :id"),
    @NamedQuery(name = "Oauth2ProviderRefreshtoken.findByToken", query = "SELECT o FROM Oauth2ProviderRefreshtoken o WHERE o.token = :token"),
    @NamedQuery(name = "Oauth2ProviderRefreshtoken.findByCreated", query = "SELECT o FROM Oauth2ProviderRefreshtoken o WHERE o.created = :created"),
    @NamedQuery(name = "Oauth2ProviderRefreshtoken.findByUpdated", query = "SELECT o FROM Oauth2ProviderRefreshtoken o WHERE o.updated = :updated"),
    @NamedQuery(name = "Oauth2ProviderRefreshtoken.findByRevoked", query = "SELECT o FROM Oauth2ProviderRefreshtoken o WHERE o.revoked = :revoked"),
    @NamedQuery(name = "Oauth2ProviderRefreshtoken.findByTokenFamily", query = "SELECT o FROM Oauth2ProviderRefreshtoken o WHERE o.tokenFamily = :tokenFamily")})
public class Oauth2ProviderRefreshtoken implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "token")
    private String token;
    @Basic(optional = false)
    @Column(name = "created")
    @Temporal(TemporalType.TIMESTAMP)
    private Date created;
    @Basic(optional = false)
    @Column(name = "updated")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updated;
    @Column(name = "revoked")
    @Temporal(TemporalType.TIMESTAMP)
    private Date revoked;
    @Column(name = "token_family")
    private String tokenFamily;
    @JoinColumn(name = "access_token_id", referencedColumnName = "id")
    @OneToOne
    private Oauth2ProviderAccesstoken accessTokenId;
    @JoinColumn(name = "application_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Oauth2ProviderApplication applicationId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesUser userId;
    @OneToOne(mappedBy = "sourceRefreshTokenId")
    private Oauth2ProviderAccesstoken oauth2ProviderAccesstoken;

    public Oauth2ProviderRefreshtoken() {
    }

    public Oauth2ProviderRefreshtoken(Long id) {
        this.id = id;
    }

    public Oauth2ProviderRefreshtoken(Long id, String token, Date created, Date updated) {
        this.id = id;
        this.token = token;
        this.created = created;
        this.updated = updated;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Date getCreated() {
        return created;
    }

    public void setCreated(Date created) {
        this.created = created;
    }

    public Date getUpdated() {
        return updated;
    }

    public void setUpdated(Date updated) {
        this.updated = updated;
    }

    public Date getRevoked() {
        return revoked;
    }

    public void setRevoked(Date revoked) {
        this.revoked = revoked;
    }

    public String getTokenFamily() {
        return tokenFamily;
    }

    public void setTokenFamily(String tokenFamily) {
        this.tokenFamily = tokenFamily;
    }

    public Oauth2ProviderAccesstoken getAccessTokenId() {
        return accessTokenId;
    }

    public void setAccessTokenId(Oauth2ProviderAccesstoken accessTokenId) {
        this.accessTokenId = accessTokenId;
    }

    public Oauth2ProviderApplication getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Oauth2ProviderApplication applicationId) {
        this.applicationId = applicationId;
    }

    public SyllabusesUser getUserId() {
        return userId;
    }

    public void setUserId(SyllabusesUser userId) {
        this.userId = userId;
    }

    public Oauth2ProviderAccesstoken getOauth2ProviderAccesstoken() {
        return oauth2ProviderAccesstoken;
    }

    public void setOauth2ProviderAccesstoken(Oauth2ProviderAccesstoken oauth2ProviderAccesstoken) {
        this.oauth2ProviderAccesstoken = oauth2ProviderAccesstoken;
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
        if (!(object instanceof Oauth2ProviderRefreshtoken)) {
            return false;
        }
        Oauth2ProviderRefreshtoken other = (Oauth2ProviderRefreshtoken) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.Oauth2ProviderRefreshtoken[ id=" + id + " ]";
    }
    
}
