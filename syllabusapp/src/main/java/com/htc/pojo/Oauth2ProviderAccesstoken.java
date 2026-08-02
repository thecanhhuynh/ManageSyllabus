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
import jakarta.persistence.Lob;
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
@Table(name = "oauth2_provider_accesstoken")
@NamedQueries({
    @NamedQuery(name = "Oauth2ProviderAccesstoken.findAll", query = "SELECT o FROM Oauth2ProviderAccesstoken o"),
    @NamedQuery(name = "Oauth2ProviderAccesstoken.findById", query = "SELECT o FROM Oauth2ProviderAccesstoken o WHERE o.id = :id"),
    @NamedQuery(name = "Oauth2ProviderAccesstoken.findByExpires", query = "SELECT o FROM Oauth2ProviderAccesstoken o WHERE o.expires = :expires"),
    @NamedQuery(name = "Oauth2ProviderAccesstoken.findByCreated", query = "SELECT o FROM Oauth2ProviderAccesstoken o WHERE o.created = :created"),
    @NamedQuery(name = "Oauth2ProviderAccesstoken.findByUpdated", query = "SELECT o FROM Oauth2ProviderAccesstoken o WHERE o.updated = :updated"),
    @NamedQuery(name = "Oauth2ProviderAccesstoken.findByTokenChecksum", query = "SELECT o FROM Oauth2ProviderAccesstoken o WHERE o.tokenChecksum = :tokenChecksum")})
public class Oauth2ProviderAccesstoken implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Lob
    @Column(name = "token")
    private String token;
    @Basic(optional = false)
    @Column(name = "expires")
    @Temporal(TemporalType.TIMESTAMP)
    private Date expires;
    @Basic(optional = false)
    @Lob
    @Column(name = "scope")
    private String scope;
    @Basic(optional = false)
    @Column(name = "created")
    @Temporal(TemporalType.TIMESTAMP)
    private Date created;
    @Basic(optional = false)
    @Column(name = "updated")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updated;
    @Basic(optional = false)
    @Column(name = "token_checksum")
    private String tokenChecksum;
    @OneToOne(mappedBy = "accessTokenId")
    private Oauth2ProviderRefreshtoken oauth2ProviderRefreshtoken;
    @JoinColumn(name = "application_id", referencedColumnName = "id")
    @ManyToOne
    private Oauth2ProviderApplication applicationId;
    @JoinColumn(name = "id_token_id", referencedColumnName = "id")
    @OneToOne
    private Oauth2ProviderIdtoken idTokenId;
    @JoinColumn(name = "source_refresh_token_id", referencedColumnName = "id")
    @OneToOne
    private Oauth2ProviderRefreshtoken sourceRefreshTokenId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne
    private SyllabusesUser userId;

    public Oauth2ProviderAccesstoken() {
    }

    public Oauth2ProviderAccesstoken(Long id) {
        this.id = id;
    }

    public Oauth2ProviderAccesstoken(Long id, String token, Date expires, String scope, Date created, Date updated, String tokenChecksum) {
        this.id = id;
        this.token = token;
        this.expires = expires;
        this.scope = scope;
        this.created = created;
        this.updated = updated;
        this.tokenChecksum = tokenChecksum;
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

    public Date getExpires() {
        return expires;
    }

    public void setExpires(Date expires) {
        this.expires = expires;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
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

    public String getTokenChecksum() {
        return tokenChecksum;
    }

    public void setTokenChecksum(String tokenChecksum) {
        this.tokenChecksum = tokenChecksum;
    }

    public Oauth2ProviderRefreshtoken getOauth2ProviderRefreshtoken() {
        return oauth2ProviderRefreshtoken;
    }

    public void setOauth2ProviderRefreshtoken(Oauth2ProviderRefreshtoken oauth2ProviderRefreshtoken) {
        this.oauth2ProviderRefreshtoken = oauth2ProviderRefreshtoken;
    }

    public Oauth2ProviderApplication getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Oauth2ProviderApplication applicationId) {
        this.applicationId = applicationId;
    }

    public Oauth2ProviderIdtoken getIdTokenId() {
        return idTokenId;
    }

    public void setIdTokenId(Oauth2ProviderIdtoken idTokenId) {
        this.idTokenId = idTokenId;
    }

    public Oauth2ProviderRefreshtoken getSourceRefreshTokenId() {
        return sourceRefreshTokenId;
    }

    public void setSourceRefreshTokenId(Oauth2ProviderRefreshtoken sourceRefreshTokenId) {
        this.sourceRefreshTokenId = sourceRefreshTokenId;
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
        if (!(object instanceof Oauth2ProviderAccesstoken)) {
            return false;
        }
        Oauth2ProviderAccesstoken other = (Oauth2ProviderAccesstoken) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.Oauth2ProviderAccesstoken[ id=" + id + " ]";
    }
    
}
