// supabase_manager.js
// Supabase自动化数据管理和配置

class SupabaseManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.tables = [
            'shops',
            'dishes',
            'recommendations',
            'monitoring_configs',
            'alerts_history'
        ];
    }

    /**
     * 自动化创建所有需要的表
     */
    async initializeDatabase() {
        console.log('🔄 开始初始化Supabase数据库...');
        
        const results = [];
        
        for (const table of this.tables) {
            try {
                await this.createTableIfNotExists(table);
                results.push({ table, status: 'success' });
            } catch (error) {
                results.push({ table, status: 'error', message: error.message });
            }
        }
        
        console.log('✅ 数据库初始化完成:', results);
        return results;
    }

    /**
     * 创建表（如果不存在）
     */
    async createTableIfNotExists(tableName) {
        // 在实际应用中，这里应该使用Supabase的SQL API执行CREATE TABLE语句
        // 由于Supabase JS SDK不支持直接执行SQL，这里提供SQL语句供手动执行
        
        const tableSQLs = {
            'shops': `
                CREATE TABLE IF NOT EXISTS shops (
                    id SERIAL PRIMARY KEY,
                    tenant_id VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    slug VARCHAR(50),
                    contact_name VARCHAR(50),
                    contact_phone VARCHAR(20),
                    contact_email VARCHAR(100),
                    description TEXT,
                    shop_type VARCHAR(20),
                    theme_color VARCHAR(20),
                    wechat_qr_url TEXT,
                    alipay_qr_url TEXT,
                    admin_password VARCHAR(100),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `,
            
            'dishes': `
                CREATE TABLE IF NOT EXISTS dishes (
                    id SERIAL PRIMARY KEY,
                    tenant_id VARCHAR(50) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    category VARCHAR(50),
                    emoji VARCHAR(10),
                    tags JSONB DEFAULT '[]',
                    is_active BOOLEAN DEFAULT true,
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY (tenant_id) REFERENCES shops(tenant_id) ON DELETE CASCADE
                );
            `,
            
            'recommendations': `
                CREATE TABLE IF NOT EXISTS recommendations (
                    id SERIAL PRIMARY KEY,
                    tenant_id VARCHAR(50) NOT NULL,
                    dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(tenant_id, dish_id)
                );
            `,
            
            'monitoring_configs': `
                CREATE TABLE IF NOT EXISTS monitoring_configs (
                    id SERIAL PRIMARY KEY,
                    tenant_id VARCHAR(50) UNIQUE NOT NULL,
                    shop_name VARCHAR(100),
                    alert_rules JSONB DEFAULT '{
                        "max_pending_orders": 10,
                        "max_waiting_time": 30,
                        "check_interval": 5,
                        "alert_channels": ["dashboard"]
                    }',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY (tenant_id) REFERENCES shops(tenant_id) ON DELETE CASCADE
                );
            `,
            
            'alerts_history': `
                CREATE TABLE IF NOT EXISTS alerts_history (
                    id SERIAL PRIMARY KEY,
                    tenant_id VARCHAR(50) NOT NULL,
                    alert_type VARCHAR(20) NOT NULL,
                    alert_title VARCHAR(200) NOT NULL,
                    alert_description TEXT,
                    alert_data JSONB DEFAULT '{}',
                    acknowledged BOOLEAN DEFAULT false,
                    acknowledged_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY (tenant_id) REFERENCES shops(tenant_id) ON DELETE CASCADE
                );
            `
        };

        if (tableSQLs[tableName]) {
            console.log(`📊 需要创建表: ${tableName}`);
            console.log(`SQL: ${tableSQLs[tableName]}`);
            
            // 在实际部署中，这里应该调用Supabase的SQL API
            // 由于安全原因，需要在服务器端执行或使用Supabase Dashboard手动执行
            
            return {
                table: tableName,
                sql: tableSQLs[tableName],
                status: 'pending_execution'
            };
        }
        
        throw new Error(`未知表名: ${tableName}`);
    }

    /**
     * 为新商家自动配置所有数据
     */
    async setupNewShop(shopData) {
        const shopId = shopData.tenant_id;
        console.log(`🏪 开始配置新商家: ${shopId}`);
        
        try {
            // 1. 创建商家记录
            const shop = await this.createShop(shopData);
            
            // 2. 初始化设置
            await this.initializeShopSettings(shopId);
            
            // 3. 创建菜品
            if (shopData.dishes && shopData.dishes.length > 0) {
                await this.createDishes(shopId, shopData.dishes);
            }
            
            // 4. 创建推荐菜品
            if (shopData.recommendDishes) {
                await this.createRecommendations(shopId, shopData.recommendDishes);
            }
            
            // 5. 创建监控配置
            await this.createMonitoringConfig(shopId, shopData.name);
            
            console.log(`✅ 商家 ${shopId} 配置完成`);
            return { success: true, shopId: shopId };
            
        } catch (error) {
            console.error(`❌ 商家配置失败:`, error);
            return { success: false, error: error.message };
        }
    }

    async createShop(shopData) {
        const { data, error } = await this.supabase
            .from('shops')
            .insert([shopData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async initializeShopSettings(shopId) {
        const settings = [
            { tenant_id: shopId, setting_key: 'sequence_prefix', setting_value: 'A' },
            { tenant_id: shopId, setting_key: 'sequence_counter', setting_value: '1' },
            { tenant_id: shopId, setting_key: 'auto_refresh', setting_value: 'true' },
            { tenant_id: shopId, setting_key: 'notification_enabled', setting_value: 'true' }
        ];

        const { error } = await this.supabase
            .from('settings')
            .insert(settings);

        if (error) throw error;
    }

    async createDishes(shopId, dishes) {
        const dishesData = dishes.map(dish => ({
            tenant_id: shopId,
            name: dish.name,
            price: dish.price,
            category: dish.category,
            emoji: dish.emoji,
            tags: dish.tags || [],
            sort_order: dish.id
        }));

        const { error } = await this.supabase
            .from('dishes')
            .insert(dishesData);

        if (error) throw error;
    }

    async createRecommendations(shopId, dishIds) {
        const recommendations = dishIds.map((dishId, index) => ({
            tenant_id: shopId,
            dish_id: dishId,
            sort_order: index + 1
        }));

        const { error } = await this.supabase
            .from('recommendations')
            .insert(recommendations);

        if (error) throw error;
    }

    async createMonitoringConfig(shopId, shopName) {
        const config = {
            tenant_id: shopId,
            shop_name: shopName,
            alert_rules: {
                max_pending_orders: 10,
                max_waiting_time: 30,
                check_interval: 5,
                alert_channels: ['dashboard', 'email']
            }
        };

        const { error } = await this.supabase
            .from('monitoring_configs')
            .insert([config]);

        if (error) throw error;
    }

    /**
     * 监控和告警功能
     */
    async checkShopHealth(shopId) {
        const healthChecks = [];
        
        // 1. 检查订单处理情况
        const orderHealth = await this.checkOrderHealth(shopId);
        healthChecks.push(orderHealth);
        
        // 2. 检查系统连接
        const connectionHealth = await this.checkConnectionHealth(shopId);
        healthChecks.push(connectionHealth);
        
        // 3. 检查配置完整性
        const configHealth = await this.checkConfigHealth(shopId);
        healthChecks.push(configHealth);
        
        // 生成健康报告
        const report = {
            shopId,
            timestamp: new Date().toISOString(),
            checks: healthChecks,
            overallStatus: healthChecks.every(h => h.status === 'healthy') ? 'healthy' : 'warning'
        };
        
        // 如果有问题，创建告警
        const problems = healthChecks.filter(h => h.status !== 'healthy');
        if (problems.length > 0) {
            await this.createAlert(shopId, 'health_check', problems);
        }
        
        return report;
    }

    async checkOrderHealth(shopId) {
        try {
            // 获取未处理订单
            const { data: pendingOrders } = await this.supabase
                .from('orders')
                .select('*')
                .eq('tenant_id', shopId)
                .eq('status', '新订单')
                .order('created_at', { ascending: true });

            // 获取等待时间过长的订单
            const now = new Date();
            const longWaitingOrders = pendingOrders.filter(order => {
                const orderTime = new Date(order.created_at);
                const waitingMinutes = (now - orderTime) / (1000 * 60);
                return waitingMinutes > 15; // 超过15分钟未处理
            });

            return {
                check: 'order_processing',
                status: longWaitingOrders.length > 0 ? 'warning' : 'healthy',
                details: {
                    pendingOrders: pendingOrders.length,
                    longWaitingOrders: longWaitingOrders.length,
                    oldestOrder: pendingOrders[0]?.created_at
                }
            };

        } catch (error) {
            return {
                check: 'order_processing',
                status: 'error',
                details: { error: error.message }
            };
        }
    }

    async createAlert(shopId, alertType, data) {
        const alertMap = {
            'health_check': {
                title: '系统健康检查异常',
                description: '检测到系统配置或运行状态异常'
            },
            'order_overflow': {
                title: '订单积压告警',
                description: '未处理订单数量超过阈值'
            },
            'connection_lost': {
                title: '数据库连接异常',
                description: '无法连接到Supabase数据库'
            }
        };

        const alertInfo = alertMap[alertType] || {
            title: '系统告警',
            description: '检测到系统异常'
        };

        const alertData = {
            tenant_id: shopId,
            alert_type: alertType,
            alert_title: alertInfo.title,
            alert_description: `${alertInfo.description} - ${shopId}`,
            alert_data: data,
            acknowledged: false
        };

        const { error } = await this.supabase
            .from('alerts_history')
            .insert([alertData]);

        if (error) {
            console.error('创建告警失败:', error);
        }
    }

    /**
     * 批量操作工具
     */
    async batchUpdateShops(updates) {
        const results = [];
        
        for (const update of updates) {
            try {
                const { data, error } = await this.supabase
                    .from('shops')
                    .update(update.data)
                    .eq('tenant_id', update.shopId);

                results.push({
                    shopId: update.shopId,
                    success: !error,
                    error: error?.message
                });
            } catch (error) {
                results.push({
                    shopId: update.shopId,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * 数据备份和恢复
     */
    async backupShopData(shopId) {
        const backup = {};
        
        // 备份商家信息
        const { data: shop } = await this.supabase
            .from('shops')
            .select('*')
            .eq('tenant_id', shopId)
            .single();
        
        backup.shop = shop;
        
        // 备份菜品
        const { data: dishes } = await this.supabase
            .from('dishes')
            .select('*')
            .eq('tenant_id', shopId);
        
        backup.dishes = dishes;
        
        // 备份设置
        const { data: settings } = await this.supabase
            .from('settings')
            .select('*')
            .eq('tenant_id', shopId);
        
        backup.settings = settings;
        
        // 备份订单（可选，可能数据量大）
        const { data: recentOrders } = await this.supabase
            .from('orders')
            .select('*')
            .eq('tenant_id', shopId)
            .order('created_at', { ascending: false })
            .limit(100);
        
        backup.recentOrders = recentOrders;
        
        // 生成备份文件
        const backupStr = JSON.stringify(backup, null, 2);
        const backupName = `backup_${shopId}_${new Date().toISOString().split('T')[0]}.json`;
        
        return {
            filename: backupName,
            data: backupStr,
            size: backupStr.length,
            timestamp: new Date().toISOString()
        };
    }
}

// 导出单例
let supabaseManagerInstance = null;

export function getSupabaseManager(supabaseClient) {
    if (!supabaseManagerInstance) {
        supabaseManagerInstance = new SupabaseManager(supabaseClient);
    }
    return supabaseManagerInstance;
}

// 浏览器环境导出
if (typeof window !== 'undefined') {
    window.SupabaseManager = SupabaseManager;
}