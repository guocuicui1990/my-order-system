#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 检查参数
if (process.argv.length < 3) {
  console.error('Usage: node update_config.txt <new_config_file>');
  process.exit(1);
}

const newConfigFile = process.argv[2];
const configFile = path.join(__dirname, 'config.js');

console.log('📋 更新config.js，配置文件:', newConfigFile);

try {
  // 读取新配置
  const newConfigData = fs.readFileSync(newConfigFile, 'utf8');
  const newConfig = JSON.parse(newConfigData);
  
  const shopId = Object.keys(newConfig)[0];
  const shopConfig = newConfig[shopId];
  
  console.log(`商家ID: ${shopId}`);
  console.log('商家名称:', shopConfig.name);
  console.log('菜品数量:', shopConfig.dishes?.length || 0);
  
  // 读取现有的config.js
  let content = fs.readFileSync(configFile, 'utf8');
  
  // 准备新的商家配置字符串（使用双引号，缩进4空格）
  const newShopConfigStr = `    "${shopId}": ${JSON.stringify(shopConfig, null, 4)}`;
  
  // 检查是否已存在该商家
  if (content.includes(`"${shopId}":`)) {
    console.log(`🔄 更新现有商家: ${shopId}`);
    
    // 使用正则匹配并替换
    const pattern = new RegExp(
      `"${shopId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
      'm'
    );
    
    content = content.replace(pattern, newShopConfigStr);
  } else {
    console.log(`➕ 添加新商家: ${shopId}`);
    
    // ==== 改进的定位方式：找到 window.shopConfigs = { 并匹配正确的结束大括号 ====
    const startMarker = 'window.shopConfigs = {';
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) {
      throw new Error('未找到 window.shopConfigs 定义');
    }
    
    // 从 startIdx 之后开始遍历，统计大括号，同时忽略字符串内的大括号
    let braceCount = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;
    
    for (let i = startIdx + startMarker.length; i < content.length; i++) {
      const char = content[i];
      
      // 处理转义字符
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\' && inString) {
        escape = true;
        continue;
      }
      
      // 处理字符串开始/结束
      if (char === '"' || char === "'") {
        if (!inString) {
          inString = char;
        } else if (inString === char) {
          inString = false;
        }
        continue;
      }
      
      // 如果不在字符串内，统计大括号
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIdx = i + 1; // 包含这个 '}'
            break;
          }
        }
      }
    }
    
    if (endIdx === -1) {
      throw new Error('未找到 window.shopConfigs 对象的结束位置');
    }
    
    // 检查最后一个属性后面是否已有逗号
    const beforeEnd = content.substring(startIdx, endIdx - 1); // 去掉最后的 '}'
    const trimmedBefore = beforeEnd.trimEnd();
    const lastChar = trimmedBefore.slice(-1);
    
    let insertStr;
    if (lastChar === ',') {
      // 如果已经有逗号，直接插入新属性
      insertStr = `\n${newShopConfigStr}`;
    } else {
      // 否则需要添加逗号
      insertStr = `,\n${newShopConfigStr}`;
    }
    
    // 在结束大括号之前插入新配置
    content = content.substring(0, endIdx - 1) + insertStr + '\n' + content.substring(endIdx - 1);
  }
  
  // 保存更新
  fs.writeFileSync(configFile, content);
  console.log('✅ config.js更新成功！');
  
} catch (error) {
  console.error('❌ 更新失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
