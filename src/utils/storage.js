/**
 * Chrome Storage 封装
 * 用于管理扩展的本地存储
 */

console.log('storage.js 已加载');

const Storage = {
    /**
     * 获取设置
     * @returns {Promise<Object>} 设置对象
     */
    async getSettings() {
        try {
            const data = await chrome.storage.local.get(['settings']);
            return data.settings || {
                ollamaUrl: 'http://localhost:11434',
                chromaUrl: 'http://localhost:8000',
                embeddingModel: 'nomic-embed-text',
                customModel: '',
                collectionName: 'webpages'
            };
        } catch (error) {
            console.error('获取设置失败:', error);
            throw new Error('获取设置失败');
        }
    },

    /**
     * 获取 ChromaDB 服务器列表
     * @returns {Promise<Array>} 服务器列表
     */
    async getChromaServers() {
        try {
            const data = await chrome.storage.local.get(['chromaServers']);
            return data.chromaServers || [
                { url: 'http://localhost:8000', name: '本地服务器' }
            ];
        } catch (error) {
            console.error('获取 ChromaDB 服务器列表失败:', error);
            return [{ url: 'http://localhost:8000', name: '本地服务器' }];
        }
    },

    /**
     * 保存 ChromaDB 服务器列表
     * @param {Array} servers - 服务器列表
     * @returns {Promise<void>}
     */
    async saveChromaServers(servers) {
        try {
            await chrome.storage.local.set({ chromaServers: servers });
        } catch (error) {
            console.error('保存 ChromaDB 服务器列表失败:', error);
            throw new Error('保存 ChromaDB 服务器列表失败');
        }
    },

    /**
     * 保存设置
     * @param {Object} settings - 设置对象
     * @returns {Promise<void>}
     */
    async saveSettings(settings) {
        try {
            await chrome.storage.local.set({ settings });
        } catch (error) {
            console.error('保存设置失败:', error);
            throw new Error('保存设置失败');
        }
    },

    /**
     * 获取已捕获的页面列表
     * @returns {Promise<Array>} 页面列表
     */
    async getCapturedPages() {
        try {
            const data = await chrome.storage.local.get(['capturedPages']);
            return data.capturedPages || [];
        } catch (error) {
            console.error('获取捕获页面失败:', error);
            throw new Error('获取捕获页面失败');
        }
    },

    /**
     * 添加捕获的页面
     * @param {Object} page - 页面对象 { id, url, title, timestamp }
     * @returns {Promise<void>}
     */
    async addCapturedPage(page) {
        try {
            const pages = await this.getCapturedPages();
            pages.push(page);
            await chrome.storage.local.set({ capturedPages: pages });
        } catch (error) {
            console.error('添加捕获页面失败:', error);
            throw new Error('添加捕获页面失败');
        }
    },

    /**
     * 移除捕获的页面
     * @param {string} pageId - 页面 ID
     * @returns {Promise<void>}
     */
    async removeCapturedPage(pageId) {
        try {
            const pages = await this.getCapturedPages();
            const filteredPages = pages.filter(p => p.id !== pageId);
            await chrome.storage.local.set({ capturedPages: filteredPages });
        } catch (error) {
            console.error('移除捕获页面失败:', error);
            throw new Error('移除捕获页面失败');
        }
    },

    /**
     * 清空所有捕获的页面
     * @returns {Promise<void>}
     */
    async clearCapturedPages() {
        try {
            await chrome.storage.local.set({ capturedPages: [] });
        } catch (error) {
            console.error('清空捕获页面失败:', error);
            throw new Error('清空捕获页面失败');
        }
    },

    /**
     * 更新捕获的页面
     * @param {string} pageId - 页面 ID
     * @param {Object} updates - 更新内容
     * @returns {Promise<void>}
     */
    async updateCapturedPage(pageId, updates) {
        try {
            const pages = await this.getCapturedPages();
            const index = pages.findIndex(p => p.id === pageId);
            
            if (index !== -1) {
                pages[index] = { ...pages[index], ...updates };
                await chrome.storage.local.set({ capturedPages: pages });
            }
        } catch (error) {
            console.error('更新捕获页面失败:', error);
            throw new Error('更新捕获页面失败');
        }
    },

    /**
     * 获取缓存数据
     * @param {string} key - 缓存键
     * @returns {Promise<any>} 缓存数据
     */
    async getCache(key) {
        try {
            const data = await chrome.storage.local.get(['cache']);
            const cache = data.cache || {};
            return cache[key];
        } catch (error) {
            console.error('获取缓存失败:', error);
            return null;
        }
    },

    /**
     * 设置缓存数据
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（毫秒）
     * @returns {Promise<void>}
     */
    async setCache(key, value, ttl = 3600000) {
        try {
            const data = await chrome.storage.local.get(['cache']);
            const cache = data.cache || {};
            
            cache[key] = {
                value: value,
                expiry: Date.now() + ttl
            };
            
            await chrome.storage.local.set({ cache });
        } catch (error) {
            console.error('设置缓存失败:', error);
        }
    },

    /**
     * 清除过期缓存
     * @returns {Promise<void>}
     */
    async clearExpiredCache() {
        try {
            const data = await chrome.storage.local.get(['cache']);
            const cache = data.cache || {};
            const now = Date.now();
            
            const cleanedCache = {};
            for (const key in cache) {
                if (cache[key].expiry > now) {
                    cleanedCache[key] = cache[key];
                }
            }
            
            await chrome.storage.local.set({ cache: cleanedCache });
        } catch (error) {
            console.error('清除过期缓存失败:', error);
        }
    },

    /**
     * 清除所有缓存
     * @returns {Promise<void>}
     */
    async clearAllCache() {
        try {
            await chrome.storage.local.set({ cache: {} });
        } catch (error) {
            console.error('清除所有缓存失败:', error);
        }
    },

    /**
     * 获取存储使用情况
     * @returns {Promise<Object>} 存储信息
     */
    async getStorageInfo() {
        try {
            const data = await chrome.storage.local.get(null);
            const size = JSON.stringify(data).length;
            
            return {
                keys: Object.keys(data),
                size: size,
                sizeFormatted: this.formatBytes(size)
            };
        } catch (error) {
            console.error('获取存储信息失败:', error);
            throw new Error('获取存储信息失败');
        }
    },

    /**
     * 清除所有存储数据
     * @returns {Promise<void>}
     */
    async clearAll() {
        try {
            await chrome.storage.local.clear();
        } catch (error) {
            console.error('清除所有存储失败:', error);
            throw new Error('清除所有存储失败');
        }
    },

    /**
     * 导出数据
     * @returns {Promise<string>} JSON 字符串
     */
    async exportData() {
        try {
            const data = await chrome.storage.local.get(null);
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('导出数据失败:', error);
            throw new Error('导出数据失败');
        }
    },

    /**
     * 导入数据
     * @param {string} jsonData - JSON 字符串
     * @returns {Promise<void>}
     */
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            await chrome.storage.local.clear();
            await chrome.storage.local.set(data);
        } catch (error) {
            console.error('导入数据失败:', error);
            throw new Error('导入数据失败');
        }
    },

    /**
     * 格式化字节大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的字符串
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
};

// 如果在浏览器环境中，将 Storage 添加到全局作用域
if (typeof window !== 'undefined') {
    window.Storage = Storage;
}

// 如果在 Service Worker 或其他环境中，导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}