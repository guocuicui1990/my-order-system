#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
// 检查参数
if (process.argv.length < 3) {
  console.error('Usage: node update_config.js <new_config_file>');
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
  
  // 准备新的商家配置字符串
  const newShopConfigStr = `'${shopId}': ${JSON.stringify(shopConfig, null, 4)}`;
  
  // 检查是否已存在该商家
  if (content.includes(`'${shopId}':`)) {
    console.log(`🔄 更新现有商家: ${shopId}`);
    
    // 使用正则匹配并替换
    const pattern = new RegExp(
      `'${shopId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\s*:\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
      'm'
    );
    
    content = content.replace(pattern, newShopConfigStr);
  } else {
    console.log(`➕ 添加新商家: ${shopId}`);
    
    // 在};之前添加
    const pos = content.lastIndexOf('};');
    if (pos !== -1) {
      content = content.substring(0, pos) + 
               ',\n    ' + newShopConfigStr + '\n' +
               content.substring(pos);
    } else {
      throw new Error('未找到window.shopConfigs结束位置');
    }
  }
  
  // 保存更新
  fs.writeFileSync(configFile, content);
  console.log('✅ config.js更新成功！');
  
} catch (error) {
  console.error('❌ 更新失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
