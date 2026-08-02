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
@Table(name = "oauth2_provider_grant")
@NamedQueries({
    @NamedQuery(name = "Oauth2ProviderGrant.findAll", query = "SELECT o FROM Oauth2ProviderGrant o"),
    @NamedQuery(name = "Oauth2ProviderGrant.findById", query = "SELECT o FROM Oauth2ProviderGrant o WHERE o.id = :id"),
    @NamedQuery(name = "Oauth2ProviderGrant.findByCode", query = "SELECT o FROM Oauth2ProviderGrant o WHERE o.code = :code"),
    @NamedQuery(name = "Oauth2ProviderGrant.findByExpires", query = "SELECT o FROM Oauth2ProviderGrant o WHERE o.expires = :expires"),
    @NamedQuery(name = "Oauth2ProviderGrant.findByCreated", query = "SELECT o FROM Oauth2ProviderGrant o WHERE o.created = :created"),
    @NamedQuery(name = "Oauth2ProviderGrant.findByUpdated", query = "SELECT o FROM Oauth2ProviderGrant o WHERE o.updated = :updated"),
    @NamedQuery(name = "Oauth2ProviderGrant.findByCodeChallenge", query = "SELECT o FROM Oauth2ProviderGrant o WHERE o.codeChallenge = :codeChallenge"),
    @NamedQuery(name = "Oauth2ProviderGrant.findByCodeChallengeMethod", query = "SELECT o FROM Oauth2ProviderGrant o WHERE o.codeChallengeMethod = :codeChallengeMethod"),
    @NamedQuery(name = "Oauth2ProviderGrant.findByNonce", query = "SELECT o FROM Oauth2ProviderGrant o WHERE o.nonce = :nonce")})
public class Oauth2ProviderGrant implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "code")
    private String code;
    @Basic(optional = false)
    @Column(name = "expires")
    @Temporal(TemporalType.TIMESTAMP)
    private Date expires;
    @Basic(optional = false)
    @Lob
    @Column(name = "redirect_uri")
    private String redirectUri;
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
    @Column(name = "code_challenge")
    private String codeChallenge;
    @Basic(optional = false)
    @Column(name = "code_challenge_method")
    private String codeChallengeMethod;
    @Basic(optional = false)
    @Column(name = "nonce")
    private String nonce;
    @Basic(optional = false)
    @Lob
    @Column(name = "claims")
    private String claims;
    @JoinColumn(name = "application_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Oauth2ProviderApplication applicationId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesUser userId;

    public Oauth2ProviderGrant() {
    }

    public Oauth2ProviderGrant(Long id) {
        this.id = id;
    }

    public Oauth2ProviderGrant(Long id, String code, Date expires, String redirectUri, String scope, Date created, Date updated, String codeChallenge, String codeChallengeMethod, String nonce, String claims) {
        this.id = id;
        this.code = code;
        this.expires = expires;
        this.redirectUri = redirectUri;
        this.scope = scope;
        this.created = created;
        this.updated = updated;
        this.codeChallenge = codeChallenge;
        this.codeChallengeMethod = codeChallengeMethod;
        this.nonce = nonce;
        this.claims = claims;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Date getExpires() {
        return expires;
    }

    public void setExpires(Date expires) {
        this.expires = expires;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
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

    public String getCodeChallenge() {
        return codeChallenge;
    }

    public void setCodeChallenge(String codeChallenge) {
        this.codeChallenge = codeChallenge;
    }

    public String getCodeChallengeMethod() {
        return codeChallengeMethod;
    }

    public void setCodeChallengeMethod(String codeChallengeMethod) {
        this.codeChallengeMethod = codeChallengeMethod;
    }

    public String getNonce() {
        return nonce;
    }

    public void setNonce(String nonce) {
        this.nonce = nonce;
    }

    public String getClaims() {
        return claims;
    }

    public void setClaims(String claims) {
        this.claims = claims;
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

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Oauth2ProviderGrant)) {
            return false;
        }
        Oauth2ProviderGrant other = (Oauth2ProviderGrant) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.Oauth2ProviderGrant[ id=" + id + " ]";
    }
    
}
