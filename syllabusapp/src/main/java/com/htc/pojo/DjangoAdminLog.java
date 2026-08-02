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
@Table(name = "django_admin_log")
@NamedQueries({
    @NamedQuery(name = "DjangoAdminLog.findAll", query = "SELECT d FROM DjangoAdminLog d"),
    @NamedQuery(name = "DjangoAdminLog.findById", query = "SELECT d FROM DjangoAdminLog d WHERE d.id = :id"),
    @NamedQuery(name = "DjangoAdminLog.findByActionTime", query = "SELECT d FROM DjangoAdminLog d WHERE d.actionTime = :actionTime"),
    @NamedQuery(name = "DjangoAdminLog.findByObjectRepr", query = "SELECT d FROM DjangoAdminLog d WHERE d.objectRepr = :objectRepr"),
    @NamedQuery(name = "DjangoAdminLog.findByActionFlag", query = "SELECT d FROM DjangoAdminLog d WHERE d.actionFlag = :actionFlag")})
public class DjangoAdminLog implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @Column(name = "action_time")
    @Temporal(TemporalType.TIMESTAMP)
    private Date actionTime;
    @Lob
    @Column(name = "object_id")
    private String objectId;
    @Basic(optional = false)
    @Column(name = "object_repr")
    private String objectRepr;
    @Basic(optional = false)
    @Column(name = "action_flag")
    private short actionFlag;
    @Basic(optional = false)
    @Lob
    @Column(name = "change_message")
    private String changeMessage;
    @JoinColumn(name = "content_type_id", referencedColumnName = "id")
    @ManyToOne
    private DjangoContentType contentTypeId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private SyllabusesUser userId;

    public DjangoAdminLog() {
    }

    public DjangoAdminLog(Integer id) {
        this.id = id;
    }

    public DjangoAdminLog(Integer id, Date actionTime, String objectRepr, short actionFlag, String changeMessage) {
        this.id = id;
        this.actionTime = actionTime;
        this.objectRepr = objectRepr;
        this.actionFlag = actionFlag;
        this.changeMessage = changeMessage;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getActionTime() {
        return actionTime;
    }

    public void setActionTime(Date actionTime) {
        this.actionTime = actionTime;
    }

    public String getObjectId() {
        return objectId;
    }

    public void setObjectId(String objectId) {
        this.objectId = objectId;
    }

    public String getObjectRepr() {
        return objectRepr;
    }

    public void setObjectRepr(String objectRepr) {
        this.objectRepr = objectRepr;
    }

    public short getActionFlag() {
        return actionFlag;
    }

    public void setActionFlag(short actionFlag) {
        this.actionFlag = actionFlag;
    }

    public String getChangeMessage() {
        return changeMessage;
    }

    public void setChangeMessage(String changeMessage) {
        this.changeMessage = changeMessage;
    }

    public DjangoContentType getContentTypeId() {
        return contentTypeId;
    }

    public void setContentTypeId(DjangoContentType contentTypeId) {
        this.contentTypeId = contentTypeId;
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
        if (!(object instanceof DjangoAdminLog)) {
            return false;
        }
        DjangoAdminLog other = (DjangoAdminLog) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.DjangoAdminLog[ id=" + id + " ]";
    }
    
}
