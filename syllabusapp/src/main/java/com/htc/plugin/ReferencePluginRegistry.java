/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.htc.plugin;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 *
 * @author Admin
 */
@Component
public class PluginRegistry {
    private final Map<String, SubSectionPlugin> plugins;

    public PluginRegistry(List<SubSectionPlugin> pluginList) {
        this.plugins = pluginList.stream().collect(Collectors.toMap(SubSectionPlugin::getPluginCode, p->p));
    }
    
    public SubSectionPlugin get(String pluginCode) {
        return plugins.get(pluginCode);
    }
}
