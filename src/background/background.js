// 后台服务脚本 (Service Worker)
// 作为扩展的后台进程运行

// 扩展安装时执行
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Extension installed');
        // 初始化默认设置
        initializeDefaultSettings();
        // 创建右键菜单
        createContextMenus();
    } else if (details.reason === 'update') {
        console.log('Extension updated');
        // 更新时重新创建右键菜单
        createContextMenus();
    }
});

/**
 * 初始化默认设置
 */
async function initializeDefaultSettings() {
    const defaultSettings = {
        ollamaUrl: 'http://localhost:11434',
        chromaUrl: 'http://localhost:8000',
        embeddingModel: 'nomic-embed-text',
        customModel: '',
        collectionName: 'webpages'
    };

    await chrome.storage.local.set({
        settings: defaultSettings,
        capturedPages: []
    });

    console.log('Default settings initialized');
}

/**
 * 创建右键菜单
 */
async function createContextMenus() {
    // 清除所有现有的菜单项
    await chrome.contextMenus.removeAll();
    
    // 创建主菜单项
    chrome.contextMenus.create({
        id: 'captureToCollection',
        title: '捕获到向量数据库',
        contexts: ['selection', 'page', 'link', 'image']
    });
    
    console.log('Context menus created');
}

/**
 * 获取所有集合
 */
async function getAllCollections() {
    try {
        const data = await chrome.storage.local.get(['settings', 'chromaCollections']);
        const settings = data.settings || {};
        const collections = data.chromaCollections || [];
        
        return collections.map(c => c.name);
    } catch (error) {
        console.error('Failed to get collections:', error);
        return [];
    }
}

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'captureToCollection') {
        // 获取所有集合
        const collections = await getAllCollections();
        
        if (collections.length === 0) {
            // 如果没有集合，打开 popup 并提示用户创建集合
            chrome.action.openPopup();
            return;
        }
        
        // 创建子菜单项
        await chrome.contextMenus.removeAll();
        
        // 重新创建主菜单项
        chrome.contextMenus.create({
            id: 'captureToCollection',
            title: '捕获到向量数据库',
            contexts: ['selection', 'page', 'link', 'image']
        });
        
        // 添加子菜单项
        collections.forEach((collection, index) => {
            chrome.contextMenus.create({
                id: `captureToCollection_${collection}`,
                parentId: 'captureToCollection',
                title: collection,
                contexts: ['selection', 'page', 'link', 'image']
            });
        });
        
        // 如果用户点击的是子菜单项，执行捕获
        if (info.menuItemId.startsWith('captureToCollection_')) {
            const collectionName = info.menuItemId.replace('captureToCollection_', '');
            await captureToCollection(tab, info, collectionName);
        }
    }
});

/**
 * 捕获到指定集合
 */
async function captureToCollection(tab, info, collectionName) {
    try {
        // 发送消息到 content script 获取页面内容
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
        
        if (response && response.success) {
            // 保存到存储，稍后由 popup 处理
            await chrome.storage.local.set({
                pendingCapture: {
                    content: response.content,
                    collection: collectionName,
                    url: tab.url,
                    title: tab.title,
                    timestamp: new Date().toISOString()
                }
            });
            
            // 打开 popup
            chrome.action.openPopup();
        }
    } catch (error) {
        console.error('Capture failed:', error);
        // 如果 content script 未加载，尝试注入
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content-scripts/content-script.js']
            });
            
            // 等待一小段时间
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 再次尝试
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
            
            if (response && response.success) {
                await chrome.storage.local.set({
                    pendingCapture: {
                        content: response.content,
                        collection: collectionName,
                        url: tab.url,
                        title: tab.title,
                        timestamp: new Date().toISOString()
                    }
                });
                
                chrome.action.openPopup();
            }
        } catch (injectError) {
            console.error('Inject script failed:', injectError);
        }
    }
}

// 监听来自 popup 和 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    // 处理不同类型的消息
    switch (request.action) {
        case 'getStatus':
            handleGetStatus(sendResponse);
            return true;
            
        case 'testConnection':
            handleTestConnection(request, sendResponse);
            return true;
            
        case 'getCollections':
            handleGetCollections(sendResponse);
            return true;
            
        default:
            console.log('Unknown action:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

/**
 * 获取扩展状态
 */
async function handleGetStatus(sendResponse) {
    try {
        const data = await chrome.storage.local.get(['settings', 'capturedPages']);
        const pageCount = data.capturedPages ? data.capturedPages.length : 0;
        
        sendResponse({
            success: true,
            status: {
                pageCount: pageCount,
                settings: data.settings || {}
            }
        });
    } catch (error) {
        console.error('Get status failed:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

/**
 * 测试连接
 */
async function handleTestConnection(request, sendResponse) {
    const { type, url } = request;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            sendResponse({
                success: true,
                message: `${type} 连接成功`
            });
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Test ${type} connection failed:`, error);
        sendResponse({
            success: false,
            error: `${type} 连接失败: ${error.message}`
        });
    }
}

/**
 * 获取集合列表
 */
async function handleGetCollections(sendResponse) {
    try {
        const collections = await getAllCollections();
        sendResponse({
            success: true,
            collections: collections
        });
    } catch (error) {
        console.error('Get collections failed:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', tab.url);
        // 可以在这里添加自动捕获逻辑
    }
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
    // 可以在这里添加快捷操作
});

// 定期清理旧的捕获内容（可选）
chrome.alarms.create('cleanupOldContent', {
    periodInMinutes: 60 * 24 // 每天执行一次
}, () => {
    if (chrome.runtime.lastError) {
        console.log('Alarm already exists:', chrome.runtime.lastError.message);
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupOldContent') {
        cleanupOldContent();
    }
});

/**
 * 清理旧的捕获内容
 */
async function cleanupOldContent() {
    try {
        const data = await chrome.storage.local.get(['capturedPages']);
        if (!data.capturedPages) return;

        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000); // 30天前

        const recentPages = data.capturedPages.filter(page => {
            const timestamp = new Date(page.timestamp).getTime();
            return timestamp > thirtyDaysAgo;
        });

        if (recentPages.length !== data.capturedPages.length) {
            await chrome.storage.local.set({ capturedPages: recentPages });
            console.log(`Cleaned up ${data.capturedPages.length - recentPages.length} old pages`);
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

console.log('Background service worker initialized');