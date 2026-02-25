// ============================================
// 动态商家配置加载器
// ============================================

// 从本地存储或Supabase加载已注册的商家
async function loadRegisteredShops() {
    try {
        // 1. 先从本地存储加载
        const localShops = JSON.parse(localStorage.getItem('registered_shops') || '{}');
        
        // 2. 如果有本地商家数据，合并到配置中
        Object.keys(localShops).forEach(shopId => {
            if (!window.shopConfigs[shopId]) {
                window.shopConfigs[shopId] = {
                    name: localShops[shopId].name,
                    themeColor: localShops[shopId].themeColor || '#E63946',
                    logo: 'images/logo.png',
                    qrcode: localShops[shopId].qrcode || 'images/qrcode.jpg',
                    dishes: localShops[shopId].dishes || []
                };
            }
        });
        
        console.log('✅ 动态加载商家配置:', Object.keys(window.shopConfigs));
        
    } catch (error) {
        console.error('❌ 加载商家配置失败:', error);
    }
}

// ============================================
// 从Supabase动态加载商家菜品
// ============================================
async function loadShopDishesFromSupabase(shopId) {
    try {
        console.log('📋 从Supabase加载商家菜品，商家ID:', shopId);
        
        // 检查Supabase是否已初始化
        if (!window.supabaseClient) {
            console.log('📝 Supabase客户端未初始化，使用本地菜品');
            const localShops = JSON.parse(localStorage.getItem('registered_shops') || '{}');
            if (localShops[shopId] && localShops[shopId].dishes) {
                return localShops[shopId].dishes;
            }
            return [];
        }
        
        // 从Supabase加载商家的菜品
        const { data: dishes, error } = await window.supabaseClient
            .from('dishes')
            .select('*')
            .eq('tenant_id', shopId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        if (dishes && dishes.length > 0) {
            console.log('✅ 从Supabase加载到菜品:', dishes.length, '个');
            
            // 转换数据格式
            const formattedDishes = dishes.map(dish => ({
                id: dish.id,
                name: dish.name,
                price: parseFloat(dish.price),
                emoji: dish.emoji || '🍽️',
                category: dish.category || '未分类',
                tags: dish.tags || [],
                description: dish.description || ''
            }));
            
            return formattedDishes;
        }
        
        console.log('📝 Supabase中没有找到菜品，返回本地菜品');
        // 尝试从本地存储获取
        const localShops = JSON.parse(localStorage.getItem('registered_shops') || '{}');
        if (localShops[shopId] && localShops[shopId].dishes) {
            return localShops[shopId].dishes;
        }
        
        return [];
        
    } catch (error) {
        console.error('❌ 从Supabase加载菜品失败:', error);
        
        // 失败时尝试从本地存储获取
        const localShops = JSON.parse(localStorage.getItem('registered_shops') || '{}');
        if (localShops[shopId] && localShops[shopId].dishes) {
            return localShops[shopId].dishes;
        }
        
        return [];
    }
}

// ============================================
// 更新菜品数据的函数（供外部调用）
// ============================================
async function updateShopDishes(shopId) {
    try {
        console.log('🔄 更新商家菜品数据，商家ID:', shopId);
        
        // 从Supabase加载菜品
        const supabaseDishes = await loadShopDishesFromSupabase(shopId);
        
        // 获取当前商家配置
        const shopConfig = window.shopConfigs[shopId] || window.shopConfigs['default_shop'];
        
        if (supabaseDishes.length > 0) {
            // 使用Supabase中的菜品数据
            shopConfig.dishes = supabaseDishes;
            console.log('✅ 已更新商家菜品数据（来自Supabase）:', shopConfig.name);
        } else if (!shopConfig.dishes || shopConfig.dishes.length === 0) {
            // 如果Supabase没有数据且配置中也没有菜品，使用默认菜品
            console.log('📝 使用默认菜品数据');
            shopConfig.dishes = window.shopConfigs['default_shop'].dishes || [];
        }
        
        return shopConfig.dishes;
        
    } catch (error) {
        console.error('❌ 更新菜品数据失败:', error);
        return [];
    }
}

// 获取当前商家配置（改进版）
function getCurrentShopConfig() {
    const shopId = getCurrentShopId();
    
    // 如果配置中不存在，尝试从本地存储加载
    if (!window.shopConfigs[shopId]) {
        const localShops = JSON.parse(localStorage.getItem('registered_shops') || '{}');
        if (localShops[shopId]) {
            window.shopConfigs[shopId] = {
                name: localShops[shopId].name,
                themeColor: localShops[shopId].themeColor || '#E63946',
                logo: 'images/logo.png',
                qrcode: localShops[shopId].qrcode || 'images/qrcode.jpg',
                dishes: localShops[shopId].dishes || []
            };
        }
    }
    
    return window.shopConfigs[shopId] || window.shopConfigs['default_shop'];
}

// 页面加载时调用
document.addEventListener('DOMContentLoaded', async function() {
    // 加载已注册的商家
    await loadRegisteredShops();
    
    // 如果是顾客端或管理端页面，初始化Supabase并加载菜品
    if (typeof window.supabaseClient !== 'undefined') {
        // 获取当前商家ID
        const currentShopId = getCurrentShopId();
        
        // 更新当前商家的菜品数据
        if (currentShopId) {
            await updateShopDishes(currentShopId);
        }
    }
    
    console.log('✅ 商家配置加载完成');
});

// ============================================
// 商家配置文件 - 多商家支持
// ============================================

// 支持的商家列表 - 正确的对象格式
window.shopConfigs = {
    "default_shop": {
        "name": "我的摊位",
        "themeColor": "#E63946",
        "logo": "images/logo.png",
        "qrcode": "images/qrcode.jpg",
        "dishes": [
            {
                "id": 1,
                "name": "招牌炸酱面",
                "price": 15,
                "emoji": "🍜",
                "category": "主食",
                "tags": ["招牌"]
            },
            {
                "id": 2,
                "name": "麻辣烫套餐",
                "price": 18,
                "emoji": "🥘",
                "category": "热菜",
                "tags": ["套餐"]
            },
            {
                "id": 3,
                "name": "烤冷面",
                "price": 10,
                "emoji": "🥞",
                "category": "小吃",
                "tags": []
            },
            {
                "id": 4,
                "name": "煎饼果子",
                "price": 12,
                "emoji": "🌯",
                "category": "小吃",
                "tags": ["招牌"]
            },
            {
                "id": 5,
                "name": "凉拌黄瓜",
                "price": 8,
                "emoji": "🥒",
                "category": "凉菜",
                "tags": []
            },
            {
                "id": 6,
                "name": "米饭",
                "price": 2,
                "emoji": "🍚",
                "category": "主食",
                "tags": []
            },
            {
                "id": 7,
                "name": "可乐",
                "price": 4,
                "emoji": "🥤",
                "category": "饮料",
                "tags": []
            }
        ]
    },
    "m_mm0d62gztj7x": {
        "name": "苗家面馆（演示）",
        "themeColor": "#e63946",
        "logo": "images/logo.png",
        "qrcode": "https://slonbvmhsxqgpoodwazj.supabase.co/storage/v1/object/public/shop-qrcodes/m_mm0d62gztj7x_wechat_qrcode_1771922939655.png",
        "dishes": [
            {
                "id": 1,
                "name": "招牌炸酱面",
                "price": 15,
                "emoji": "🍜",
                "category": "主食",
                "tags": []
            },
            {
                "id": 2,
                "name": "麻辣烫套餐",
                "price": 18,
                "emoji": "🥘",
                "category": "主食",
                "tags": []
            }
        ]
    }
};

// ============================================
// 工具函数
// ============================================

// 获取当前商家ID - 管理员专用版本（完全从URL获取）
function getCurrentShopId() {
    // 只从URL参数获取，如 ?shop=老王煎饼
    const urlParams = new URLSearchParams(window.location.search);
    let shopId = urlParams.get('shop');
    
    // 如果没有URL参数，或者参数对应的商家配置不存在，使用默认
    if (!shopId || !window.shopConfigs[shopId]) {
        shopId = 'default_shop';
    }
    
    return shopId;
}

// 获取当前商家配置
function getCurrentShopConfig() {
    const shopId = getCurrentShopId();
    return window.shopConfigs[shopId] || window.shopConfigs['default_shop'];
}

// 更新页面主题
function updateThemeForShop(shopConfig) {
    // 更新CSS变量
    if (shopConfig && shopConfig.themeColor) {
        document.documentElement.style.setProperty('--primary-color', shopConfig.themeColor);
    }
    
    // 更新页面标题
    if (shopConfig && shopConfig.name) {
        document.title = `${shopConfig.name} - 扫码点餐`;
    }
    
    // 更新Logo（如果有）
    if (shopConfig && shopConfig.logo) {
        const logoImg = document.querySelector('.logo-image');
        if (logoImg) {
            logoImg.src = shopConfig.logo;
            logoImg.alt = shopConfig.name;
        }
    }
}

// 自动合并已注册商家到配置中
function autoMergeRegisteredShops() {
    try {
        const localShops = JSON.parse(localStorage.getItem('registered_shops') || '{}');
        
        for (const shopId in localShops) {
            if (!window.shopConfigs[shopId]) {
                const shopData = localShops[shopId];
                
                // 尝试从本地存储获取完整配置
                const fullConfig = JSON.parse(localStorage.getItem('shop_config_' + shopId) || '{}');
                
                if (fullConfig && fullConfig[shopId]) {
                    // 使用完整配置，但确保logo字段正确
                    window.shopConfigs[shopId] = {
                        name: shopData.name,
                        themeColor: shopData.themeColor || '#E63946',
                        logo: 'images/logo.png', // 固定logo路径
                        qrcode: fullConfig[shopId].qrcode || 'images/qrcode.jpg',
                        dishes: shopData.dishes || []
                    };
                } else {
                    // 使用基本信息创建配置
                    window.shopConfigs[shopId] = {
                        name: shopData.name,
                        themeColor: shopData.themeColor || '#E63946',
                        logo: 'images/logo.png',
                        qrcode: 'images/qrcode.jpg',
                        dishes: shopData.dishes || []
                    ,
    'e_mm1fnr0zkeoh': {
    "name": "ewwe",
    "themeColor": "#e63946",
    "logo": "images/logo.png",
    "qrcode": "https://slonbvmhsxqgpoodwazj.supabase.co/storage/v1/object/public/shop-qrcodes/e_mm1fnr0zkeoh_wechat_qrcode_1771987590037.png",
    "dishes": [
        {
            "id": 1,
            "name": "招牌炸酱面",
            "price": 15,
            "emoji": "🍜",
            "category": "主食",
            "tags": []
        },
        {
            "id": 2,
            "name": "麻辣烫套餐",
            "price": 18,
            "emoji": "🥘",
            "category": "主食",
            "tags": []
        }
    ]
}
};
                }
                
                console.log(`✅ 自动添加商家配置: ${shopData.name} (${shopId})`);
            }
        }
    } catch (error) {
        console.error('❌ 自动合并商家配置失败:', error);
    }
}

// 页面加载时自动合并
document.addEventListener('DOMContentLoaded', function() {
    autoMergeRegisteredShops();
    console.log('✅ 商家配置自动合并完成');
});

console.log('✅ 商家配置加载完成');
