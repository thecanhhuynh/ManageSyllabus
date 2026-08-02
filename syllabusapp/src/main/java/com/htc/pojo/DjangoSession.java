/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
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
@Table(name = "django_session")
@NamedQueries({
    @NamedQuery(name = "DjangoSession.findAll", query = "SELECT d FROM DjangoSession d"),
    @NamedQuery(name = "DjangoSession.findBySessionKey", query = "SELECT d FROM DjangoSession d WHERE d.sessionKey = :sessionKey"),
    @NamedQuery(name = "DjangoSession.findByExpireDate", query = "SELECT d FROM DjangoSession d WHERE d.expireDate = :expireDate")})
public class DjangoSession implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "session_key")
    private String sessionKey;
    @Basic(optional = false)
    @Lob
    @Column(name = "session_data")
    private String sessionData;
    @Basic(optional = false)
    @Column(name = "expire_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date expireDate;

    public DjangoSession() {
    }

    public DjangoSession(String sessionKey) {
        this.sessionKey = sessionKey;
    }

    public DjangoSession(String sessionKey, String sessionData, Date expireDate) {
        this.sessionKey = sessionKey;
        this.sessionData = sessionData;
        this.expireDate = expireDate;
    }

    public String getSessionKey() {
        return sessionKey;
    }

    public void setSessionKey(String sessionKey) {
        this.sessionKey = sessionKey;
    }

    public String getSessionData() {
        return sessionData;
    }

    public void setSessionData(String sessionData) {
        this.sessionData = sessionData;
    }

    public Date getExpireDate() {
        return expireDate;
    }

    public void setExpireDate(Date expireDate) {
        this.expireDate = expireDate;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (sessionKey != null ? sessionKey.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof DjangoSession)) {
            return false;
        }
        DjangoSession other = (DjangoSession) object;
        if ((this.sessionKey == null && other.sessionKey != null) || (this.sessionKey != null && !this.sessionKey.equals(other.sessionKey))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.DjangoSession[ sessionKey=" + sessionKey + " ]";
    }
    
}
