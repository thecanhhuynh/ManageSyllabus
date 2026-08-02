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
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
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
@Table(name = "oauth2_provider_application")
@NamedQueries({
    @NamedQuery(name = "Oauth2ProviderApplication.findAll", query = "SELECT o FROM Oauth2ProviderApplication o"),
    @NamedQuery(name = "Oauth2ProviderApplication.findById", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.id = :id"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByClientId", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.clientId = :clientId"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByClientType", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.clientType = :clientType"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByAuthorizationGrantType", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.authorizationGrantType = :authorizationGrantType"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByClientSecret", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.clientSecret = :clientSecret"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByName", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.name = :name"),
    @NamedQuery(name = "Oauth2ProviderApplication.findBySkipAuthorization", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.skipAuthorization = :skipAuthorization"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByCreated", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.created = :created"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByUpdated", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.updated = :updated"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByAlgorithm", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.algorithm = :algorithm"),
    @NamedQuery(name = "Oauth2ProviderApplication.findByHashClientSecret", query = "SELECT o FROM Oauth2ProviderApplication o WHERE o.hashClientSecret = :hashClientSecret")})
public class Oauth2ProviderApplication implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "client_id")
    private String clientId;
    @Basic(optional = false)
    @Lob
    @Column(name = "redirect_uris")
    private String redirectUris;
    @Basic(optional = false)
    @Column(name = "client_type")
    private String clientType;
    @Basic(optional = false)
    @Column(name = "authorization_grant_type")
    private String authorizationGrantType;
    @Basic(optional = false)
    @Column(name = "client_secret")
    private String clientSecret;
    @Basic(optional = false)
    @Column(name = "name")
    private String name;
    @Basic(optional = false)
    @Column(name = "skip_authorization")
    private boolean skipAuthorization;
    @Basic(optional = false)
    @Column(name = "created")
    @Temporal(TemporalType.TIMESTAMP)
    private Date created;
    @Basic(optional = false)
    @Column(name = "updated")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updated;
    @Basic(optional = false)
    @Column(name = "algorithm")
    private String algorithm;
    @Basic(optional = false)
    @Lob
    @Column(name = "post_logout_redirect_uris")
    private String postLogoutRedirectUris;
    @Basic(optional = false)
    @Column(name = "hash_client_secret")
    private boolean hashClientSecret;
    @Basic(optional = false)
    @Lob
    @Column(name = "allowed_origins")
    private String allowedOrigins;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "applicationId")
    private Set<Oauth2ProviderGrant> oauth2ProviderGrantSet;
    @OneToMany(mappedBy = "applicationId")
    private Set<Oauth2ProviderIdtoken> oauth2ProviderIdtokenSet;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne
    private SyllabusesUser userId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "applicationId")
    private Set<Oauth2ProviderRefreshtoken> oauth2ProviderRefreshtokenSet;
    @OneToMany(mappedBy = "applicationId")
    private Set<Oauth2ProviderAccesstoken> oauth2ProviderAccesstokenSet;

    public Oauth2ProviderApplication() {
    }

    public Oauth2ProviderApplication(Long id) {
        this.id = id;
    }

    public Oauth2ProviderApplication(Long id, String clientId, String redirectUris, String clientType, String authorizationGrantType, String clientSecret, String name, boolean skipAuthorization, Date created, Date updated, String algorithm, String postLogoutRedirectUris, boolean hashClientSecret, String allowedOrigins) {
        this.id = id;
        this.clientId = clientId;
        this.redirectUris = redirectUris;
        this.clientType = clientType;
        this.authorizationGrantType = authorizationGrantType;
        this.clientSecret = clientSecret;
        this.name = name;
        this.skipAuthorization = skipAuthorization;
        this.created = created;
        this.updated = updated;
        this.algorithm = algorithm;
        this.postLogoutRedirectUris = postLogoutRedirectUris;
        this.hashClientSecret = hashClientSecret;
        this.allowedOrigins = allowedOrigins;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getRedirectUris() {
        return redirectUris;
    }

    public void setRedirectUris(String redirectUris) {
        this.redirectUris = redirectUris;
    }

    public String getClientType() {
        return clientType;
    }

    public void setClientType(String clientType) {
        this.clientType = clientType;
    }

    public String getAuthorizationGrantType() {
        return authorizationGrantType;
    }

    public void setAuthorizationGrantType(String authorizationGrantType) {
        this.authorizationGrantType = authorizationGrantType;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean getSkipAuthorization() {
        return skipAuthorization;
    }

    public void setSkipAuthorization(boolean skipAuthorization) {
        this.skipAuthorization = skipAuthorization;
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

    public String getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(String algorithm) {
        this.algorithm = algorithm;
    }

    public String getPostLogoutRedirectUris() {
        return postLogoutRedirectUris;
    }

    public void setPostLogoutRedirectUris(String postLogoutRedirectUris) {
        this.postLogoutRedirectUris = postLogoutRedirectUris;
    }

    public boolean getHashClientSecret() {
        return hashClientSecret;
    }

    public void setHashClientSecret(boolean hashClientSecret) {
        this.hashClientSecret = hashClientSecret;
    }

    public String getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public Set<Oauth2ProviderGrant> getOauth2ProviderGrantSet() {
        return oauth2ProviderGrantSet;
    }

    public void setOauth2ProviderGrantSet(Set<Oauth2ProviderGrant> oauth2ProviderGrantSet) {
        this.oauth2ProviderGrantSet = oauth2ProviderGrantSet;
    }

    public Set<Oauth2ProviderIdtoken> getOauth2ProviderIdtokenSet() {
        return oauth2ProviderIdtokenSet;
    }

    public void setOauth2ProviderIdtokenSet(Set<Oauth2ProviderIdtoken> oauth2ProviderIdtokenSet) {
        this.oauth2ProviderIdtokenSet = oauth2ProviderIdtokenSet;
    }

    public SyllabusesUser getUserId() {
        return userId;
    }

    public void setUserId(SyllabusesUser userId) {
        this.userId = userId;
    }

    public Set<Oauth2ProviderRefreshtoken> getOauth2ProviderRefreshtokenSet() {
        return oauth2ProviderRefreshtokenSet;
    }

    public void setOauth2ProviderRefreshtokenSet(Set<Oauth2ProviderRefreshtoken> oauth2ProviderRefreshtokenSet) {
        this.oauth2ProviderRefreshtokenSet = oauth2ProviderRefreshtokenSet;
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
        if (!(object instanceof Oauth2ProviderApplication)) {
            return false;
        }
        Oauth2ProviderApplication other = (Oauth2ProviderApplication) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.Oauth2ProviderApplication[ id=" + id + " ]";
    }
    
}
