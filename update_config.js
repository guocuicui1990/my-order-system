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

  // 读取现有config.js
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

    // 定义标记（必须与 config.js 中的完全一致）
    const startMarker = '// ---------- 商家配置开始标记 ----------';
    const endMarker = '// ---------- 商家配置结束标记 ----------';

    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1) {
      throw new Error('未找到配置标记，请确保config.js中包含开始和结束标记');
    }

    // 找到结束标记之前的最后一个换行符的位置
    const lastNewLineBeforeEnd = content.lastIndexOf('\n', endIdx);
    if (lastNewLineBeforeEnd === -1) {
      throw new Error('无法定位结束标记前的换行');
    }

    // 获取结束标记前一行的内容（即对象定义的最后一行）
    const prevLineStart = content.lastIndexOf('\n', lastNewLineBeforeEnd - 1) + 1;
    const prevLine = content.substring(prevLineStart, lastNewLineBeforeEnd).trim();

    // 判断是否需要添加逗号
    let needComma = true;
    if (prevLine.endsWith(',') || prevLine.endsWith('{') || prevLine.endsWith('}') || prevLine.endsWith('};')) {
      needComma = false; // 如果已经以逗号或大括号结尾，不加逗号
    }

    const insertStr = needComma ? ',\n' + newShopConfigStr : '\n' + newShopConfigStr;

    // 在结束标记前一行之后插入新内容
    content = content.substring(0, lastNewLineBeforeEnd + 1) + insertStr + content.substring(lastNewLineBeforeEnd + 1);
  }

  // 保存更新
  fs.writeFileSync(configFile, content);
  console.log('✅ config.js更新成功！');

} catch (error) {
  console.error('❌ 更新失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
