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
@Table(name = "oauth2_provider_idtoken")
@NamedQueries({
    @NamedQuery(name = "Oauth2ProviderIdtoken.findAll", query = "SELECT o FROM Oauth2ProviderIdtoken o"),
    @NamedQuery(name = "Oauth2ProviderIdtoken.findById", query = "SELECT o FROM Oauth2ProviderIdtoken o WHERE o.id = :id"),
    @NamedQuery(name = "Oauth2ProviderIdtoken.findByJti", query = "SELECT o FROM Oauth2ProviderIdtoken o WHERE o.jti = :jti"),
    @NamedQuery(name = "Oauth2ProviderIdtoken.findByExpires", query = "SELECT o FROM Oauth2ProviderIdtoken o WHERE o.expires = :expires"),
    @NamedQuery(name = "Oauth2ProviderIdtoken.findByCreated", query = "SELECT o FROM Oauth2ProviderIdtoken o WHERE o.created = :created"),
    @NamedQuery(name = "Oauth2ProviderIdtoken.findByUpdated", query = "SELECT o FROM Oauth2ProviderIdtoken o WHERE o.updated = :updated")})
public class Oauth2ProviderIdtoken implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @Column(name = "jti")
    private String jti;
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
    @JoinColumn(name = "application_id", referencedColumnName = "id")
    @ManyToOne
    private Oauth2ProviderApplication applicationId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne
    private SyllabusesUser userId;
    @OneToOne(mappedBy = "idTokenId")
    private Oauth2ProviderAccesstoken oauth2ProviderAccesstoken;

    public Oauth2ProviderIdtoken() {
    }

    public Oauth2ProviderIdtoken(Long id) {
        this.id = id;
    }

    public Oauth2ProviderIdtoken(Long id, String jti, Date expires, String scope, Date created, Date updated) {
        this.id = id;
        this.jti = jti;
        this.expires = expires;
        this.scope = scope;
        this.created = created;
        this.updated = updated;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getJti() {
        return jti;
    }

    public void setJti(String jti) {
        this.jti = jti;
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
        if (!(object instanceof Oauth2ProviderIdtoken)) {
            return false;
        }
        Oauth2ProviderIdtoken other = (Oauth2ProviderIdtoken) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.Oauth2ProviderIdtoken[ id=" + id + " ]";
    }
    
}
