/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.io.Serializable;

/**
 *
 * @author Admin
 */
@Entity
@Table(name = "syllabuses_templatetablesubsection")
@NamedQueries({
    @NamedQuery(name = "SyllabusesTemplatetablesubsection.findAll", query = "SELECT s FROM SyllabusesTemplatetablesubsection s"),
    @NamedQuery(name = "SyllabusesTemplatetablesubsection.findByTemplatesubsectionPtrId", query = "SELECT s FROM SyllabusesTemplatetablesubsection s WHERE s.templatesubsectionPtrId = :templatesubsectionPtrId")})
public class SyllabusesTemplatetablesubsection implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "templatesubsection_ptr_id")
    private Long templatesubsectionPtrId;
    @Lob
    @Column(name = "table_schema")
    private String tableSchema;
    @JoinColumn(name = "templatesubsection_ptr_id", referencedColumnName = "id", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private SyllabusesTemplatesubsection syllabusesTemplatesubsection;

    public SyllabusesTemplatetablesubsection() {
    }

    public SyllabusesTemplatetablesubsection(Long templatesubsectionPtrId) {
        this.templatesubsectionPtrId = templatesubsectionPtrId;
    }

    public Long getTemplatesubsectionPtrId() {
        return templatesubsectionPtrId;
    }

    public void setTemplatesubsectionPtrId(Long templatesubsectionPtrId) {
        this.templatesubsectionPtrId = templatesubsectionPtrId;
    }

    public String getTableSchema() {
        return tableSchema;
    }

    public void setTableSchema(String tableSchema) {
        this.tableSchema = tableSchema;
    }

    public SyllabusesTemplatesubsection getSyllabusesTemplatesubsection() {
        return syllabusesTemplatesubsection;
    }

    public void setSyllabusesTemplatesubsection(SyllabusesTemplatesubsection syllabusesTemplatesubsection) {
        this.syllabusesTemplatesubsection = syllabusesTemplatesubsection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (templatesubsectionPtrId != null ? templatesubsectionPtrId.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof SyllabusesTemplatetablesubsection)) {
            return false;
        }
        SyllabusesTemplatetablesubsection other = (SyllabusesTemplatetablesubsection) object;
        if ((this.templatesubsectionPtrId == null && other.templatesubsectionPtrId != null) || (this.templatesubsectionPtrId != null && !this.templatesubsectionPtrId.equals(other.templatesubsectionPtrId))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.htc.pojo.SyllabusesTemplatetablesubsection[ templatesubsectionPtrId=" + templatesubsectionPtrId + " ]";
    }
    
}
