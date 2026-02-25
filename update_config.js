#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

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

  // 读取现有 config.js
  let content = fs.readFileSync(configFile, 'utf8');

  // 准备新商家配置字符串（使用双引号，缩进4空格）
  const newShopConfigStr = `    "${shopId}": ${JSON.stringify(shopConfig, null, 4)}`;

  // 检查是否已存在该商家
  if (content.includes(`"${shopId}":`)) {
    console.log(`🔄 更新现有商家: ${shopId}`);
    const pattern = new RegExp(
      `"${shopId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
      'm'
    );
    content = content.replace(pattern, newShopConfigStr);
  } else {
    console.log(`➕ 添加新商家: ${shopId}`);

    // 定位 window.shopConfigs = { 的位置
    const objStart = content.indexOf('window.shopConfigs = {');
    if (objStart === -1) throw new Error('未找到 window.shopConfigs 定义');

    // 从 objStart 之后开始解析大括号，找到匹配的结束 }
    let braceCount = 0;
    let inString = false;
    let escape = false;
    let objEnd = -1;

    for (let i = objStart + 'window.shopConfigs = {'.length; i < content.length; i++) {
      const char = content[i];
      
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\' && inString) {
        escape = true;
        continue;
      }
      if (char === '"' || char === "'") {
        if (!inString) {
          inString = char;
        } else if (inString === char) {
          inString = false;
        }
        continue;
      }
      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') {
          if (braceCount === 0) {
            objEnd = i; // 找到匹配的结束 }
            break;
          } else {
            braceCount--;
          }
        }
      }
    }

    if (objEnd === -1) throw new Error('无法找到 window.shopConfigs 对象的结束位置');

    // 找到 objEnd 之前的非空白字符，判断是否需要逗号
    let lastNonSpace = objEnd - 1;
    while (lastNonSpace >= 0 && /\s/.test(content[lastNonSpace])) lastNonSpace--;
    const lastChar = content[lastNonSpace];
    
    // 决定是否需要逗号
    const needComma = lastChar !== ',' && lastChar !== '{' && lastChar !== '}' && lastChar !== ';';
    
    // 构造插入字符串
    const insertStr = needComma ? ',\n' + newShopConfigStr : '\n' + newShopConfigStr;
    
    // 在 objEnd 之前插入（注意 objEnd 是 '}' 的位置）
    content = content.substring(0, objEnd) + insertStr + '\n' + content.substring(objEnd);
  }

  // 保存更新
  fs.writeFileSync(configFile, content);
  console.log('✅ config.js更新成功！');

} catch (error) {
  console.error('❌ 更新失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
