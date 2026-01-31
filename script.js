// ============================================
// 菜品数据处理函数（可选使用）
// ============================================

// 菜品数据（SVG图片版本）
var dishesWithImages = [
    { 
        id: 1, 
        name: '宫保鸡丁', 
        price: 38, 
        category: '热菜', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23FFE5E5" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🍗%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E宫保鸡丁%3C/text%3E%3C/svg%3E'
    },
    { 
        id: 2, 
        name: '鱼香肉丝', 
        price: 35, 
        category: '热菜', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23FFF3E0" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🥘%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E鱼香肉丝%3C/text%3E%3C/svg%3E'
    },
    { 
        id: 3, 
        name: '麻婆豆腐', 
        price: 28, 
        category: '热菜', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23FFEBEE" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🍲%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E麻婆豆腐%3C/text%3E%3C/svg%3E'
    },
    { 
        id: 4, 
        name: '凉拌黄瓜', 
        price: 15, 
        category: '凉菜', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23E8F5E9" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🥒%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E凉拌黄瓜%3C/text%3E%3C/svg%3E'
    },
    { 
        id: 5, 
        name: '拍黄瓜', 
        price: 12, 
        category: '凉菜', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23E1F5FE" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🥗%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E拍黄瓜%3C/text%3E%3C/svg%3E'
    },
    { 
        id: 6, 
        name: '米饭', 
        price: 3, 
        category: '主食', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23FFF9C4" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🍚%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E米饭%3C/text%3E%3C/svg%3E'
    },
    { 
        id: 7, 
        name: '炒饭', 
        price: 18, 
        category: '主食', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23FFF3E0" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🍛%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E炒饭%3C/text%3E%3C/svg%3E'
    },
    { 
        id: 8, 
        name: '可乐', 
        price: 8, 
        category: '饮料', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23E3F2FD" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🥤%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E可乐%3C/text%3E%3C/svg%3E'
    },
    { 
        id: 9, 
        name: '雪碧', 
        price: 8, 
        category: '饮料', 
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23F1F8E9" width="150" height="150"/%3E%3Ctext x="75" y="70" font-size="40" text-anchor="middle"%3E🥤%3C/text%3E%3Ctext x="75" y="100" font-size="14" text-anchor="middle" fill="%23666"%3E雪碧%3C/text%3E%3C/svg%3E'
    },
];

// 导出到全局
window.dishesWithImages = dishesWithImages;

// 辅助函数：格式化金额
function formatCurrency(amount) {
    return '¥' + parseFloat(amount).toFixed(2);
}

// 辅助函数：生成订单号
function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return year + month + day + hour + minute + second + random;
}

// 导出到全局
window.generateOrderNumber = generateOrderNumber;

console.log('✅ script.js 加载完成');