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
    
    // 使用正则匹配并替换（只替换对象内部的，不破坏结构）
    const pattern = new RegExp(
      `"${shopId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
      'm'
    );
    content = content.replace(pattern, newShopConfigStr);
  } else {
    console.log(`➕ 添加新商家: ${shopId}`);
    
    // 查找标记的位置
    const startMarker = '// ---------- 商家配置开始标记 ----------';
    const endMarker = '// ---------- 商家配置结束标记 ----------';
    
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error('未找到配置标记，请确保config.js中包含开始和结束标记');
    }
    
    // 找到结束标记之前的最后一个大括号的位置（即对象结束的 }; 后面）
    // 我们在结束标记前查找最后一个 "};" 的位置，但更简单的是直接在结束标记前插入
    // 为了确保插入后格式正确，我们可以在结束标记的前一行插入新配置
    // 首先找到结束标记前最近的换行，然后插入新配置，并确保有逗号
    
    // 获取结束标记之前的文本
    const beforeEnd = content.substring(startIdx + startMarker.length, endIdx);
    
    // 检查最后一个非空行是否以 "}," 或 "}" 结尾
    const lines = beforeEnd.split('\n');
    let lastNonEmptyLine = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed !== '') {
        lastNonEmptyLine = trimmed;
        break;
      }
    }
    
    // 决定是否需要添加逗号
    let insertStr;
    if (lastNonEmptyLine.endsWith(',')) {
      // 如果已经有逗号，直接插入
      insertStr = `\n${newShopConfigStr}`;
    } else if (lastNonEmptyLine.endsWith('}')) {
      // 如果是以 } 结尾（最后一个商家），需要添加逗号
      insertStr = `,\n${newShopConfigStr}`;
    } else {
      // 其他情况，保守起见也添加逗号
      insertStr = `,\n${newShopConfigStr}`;
    }
    
    // 在结束标记之前插入新配置
    // 找到结束标记的精确位置，插入到它前面
    const insertPos = content.lastIndexOf('\n', endIdx); // 在结束标记所在行的行首插入
    content = content.substring(0, insertPos) + insertStr + '\n' + content.substring(insertPos);
  }
  
  // 保存更新
  fs.writeFileSync(configFile, content);
  console.log('✅ config.js更新成功！');
  
} catch (error) {
  console.error('❌ 更新失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
