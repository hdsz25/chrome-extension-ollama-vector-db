// 注意：工具函数通过 HTML 中的 script 标签导入

console.log('====================================');
console.log('popup.js 已加载！');
console.log('时间:', new Date().toISOString());
console.log('====================================');

// 全局状态
let currentSettings = {
    ollamaUrl: 'http://localhost:11434',
    chromaUrl: 'http://localhost:8000',
    embeddingModel: 'nomic-embed-text',
    customModel: '',
    collectionName: 'webpages'
};

// DOM 元素
const elements = {
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    captureBtn: document.getElementById('captureBtn'),
    captureSelectionBtn: document.getElementById('captureSelectionBtn'),
    captureStatus: document.getElementById('captureStatus'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchResults: document.getElementById('searchResults'),
    resultsList: document.querySelector('.results-list'),
    snippetLength: document.getElementById('snippetLength'),
    refreshBtn: document.getElementById('refreshBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    manageList: document.getElementById('manageList'),
    ollamaUrl: document.getElementById('ollamaUrl'),
    testOllamaBtn: document.getElementById('testOllamaBtn'),
    ollamaTestStatus: document.getElementById('ollamaTestStatus'),
    chromaUrlSelect: document.getElementById('chromaUrlSelect'),
    chromaUrl: document.getElementById('chromaUrl'),
    testChromaBtn: document.getElementById('testChromaBtn'),
    chromaTestStatus: document.getElementById('chromaTestStatus'),
    newChromaUrl: document.getElementById('newChromaUrl'),
    addChromaServerBtn: document.getElementById('addChromaServerBtn'),
    chromaServerList: document.getElementById('chromaServerList'),
    loadCollectionsBtn: document.getElementById('loadCollectionsBtn'),
    newCollectionName: document.getElementById('newCollectionName'),
    createCollectionBtn: document.getElementById('createCollectionBtn'),
    collectionList: document.getElementById('collectionList'),
    manageServerSelect: document.getElementById('manageServerSelect'),
    renameCollectionModal: document.getElementById('renameCollectionModal'),
    newCollectionNameInput: document.getElementById('newCollectionNameInput'),
    cancelRenameBtn: document.getElementById('cancelRenameBtn'),
    confirmRenameBtn: document.getElementById('confirmRenameBtn'),
    manageCollectionSelect: document.getElementById('manageCollectionSelect'),
    refreshContentBtn: document.getElementById('refreshContentBtn'),
    clearAllContentBtn: document.getElementById('clearAllContentBtn'),
    contentList: document.getElementById('contentList'),
    captureServer: document.getElementById('captureServer'),
    captureServerUrl: document.getElementById('captureServerUrl'),
    captureCollection: document.getElementById('captureCollection'),
    uploadServer: document.getElementById('uploadServer'),
    uploadCollection: document.getElementById('uploadCollection'),
    fileInput: document.getElementById('fileInput'),
    dropZone: document.getElementById('dropZone'),
    fileList: document.getElementById('fileList'),
    uploadBtn: document.getElementById('uploadBtn'),
    uploadStatus: document.getElementById('uploadStatus'),
    removeDuplicatesBtn: document.getElementById('removeDuplicatesBtn'),
    captureCollectionDisplay: document.getElementById('captureCollectionDisplay'),
    captureCollectionText: document.getElementById('captureCollectionText'),
    captureCollectionCount: document.getElementById('captureCollectionCount'),
    captureCollectionDropdown: document.getElementById('captureCollectionDropdown'),
    searchServer: document.getElementById('searchServer'),
    searchServerUrl: document.getElementById('searchServerUrl'),
    searchCollection: document.getElementById('searchCollection'),
    searchCollectionDisplay: document.getElementById('searchCollectionDisplay'),
    searchCollectionText: document.getElementById('searchCollectionText'),
    searchCollectionCount: document.getElementById('searchCollectionCount'),
    searchCollectionDropdown: document.getElementById('searchCollectionDropdown'),
    embeddingModel: document.getElementById('embeddingModel'),
    loadModelsBtn: document.getElementById('loadModelsBtn'),
    customModel: document.getElementById('customModel'),
    customModelGroup: document.getElementById('customModelGroup'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    settingsStatus: document.getElementById('settingsStatus')
};

// ChromaDB 服务器列表
let chromaServers = [];

// ChromaDB 集合列表（按服务器分组）
let chromaCollectionsByServer = {};

// 当前正在重命名的集合
let currentRenameCollection = null;

// 选中的集合（按服务器分组存储，用于捕获和搜索）
// 格式: { serverUrl: ['collection1', 'collection2'] }
let selectedCaptureCollectionsByServer = {};
let selectedSearchCollectionsByServer = {};

// 当前选中的集合（用于显示）
let selectedCaptureCollections = [];
let selectedSearchCollections = [];

// 待上传文件列表
let uploadFiles = [];

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('====================================');
    console.log('DOMContentLoaded 事件触发！');
    console.log('时间:', new Date().toISOString());
    console.log('====================================');
    
    // 验证关键元素是否存在
    const criticalElements = ['testOllamaBtn', 'testChromaBtn', 'loadModelsBtn', 'chromaUrl'];
    console.log('验证关键元素...');
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  ${id}:`, element ? '✓' : '✗');
        if (!element) {
            console.error(`Element not found: ${id}`);
        }
    });
    
    console.log('开始加载设置...');
    await loadSettings();
    
    // 加载选中的集合
    await loadSelectedCollections();
    
    console.log('开始加载 ChromaDB 服务器...');
    await loadChromaServers();
    console.log('ChromaDB 服务器加载完成，数量:', chromaServers.length);
    console.log('ChromaDB 服务器列表:', chromaServers);
    
    console.log('设置事件监听器...');
    setupEventListeners();
    
    console.log('加载服务器列表到管理页面...');
    loadChromaServersToManage();
    
    console.log('加载集合列表...');
    await loadChromaCollections();
    
    console.log('初始化完成！');
    console.log('====================================');
});

// 刷新所有页面的服务器选择器
function refreshAllServerSelectors(selectedUrl) {
    console.log('刷新所有服务器选择器，选中:', selectedUrl);
    
    // 更新设置页面
    if (elements.chromaUrlSelect) {
        elements.chromaUrlSelect.value = selectedUrl;
    }
    if (elements.chromaUrl) {
        elements.chromaUrl.value = selectedUrl;
    }
    
    // 更新管理页面
    if (elements.manageServerSelect) {
        elements.manageServerSelect.value = selectedUrl;
    }
    
    // 更新捕获页面
    if (elements.captureServer) {
        elements.captureServer.value = selectedUrl;
        if (elements.captureServerUrl) {
            elements.captureServerUrl.textContent = selectedUrl;
        }
    }
    
    // 更新搜索页面
    if (elements.searchServer) {
        elements.searchServer.value = selectedUrl;
        if (elements.searchServerUrl) {
            elements.searchServerUrl.textContent = selectedUrl;
        }
    }

    // 更新上传页面
    if (elements.uploadServer) {
        elements.uploadServer.value = selectedUrl;
    }
    
    console.log('所有服务器选择器已刷新');
}

// 加载服务器列表到管理页面
function loadChromaServersToManage() {
    console.log('loadChromaServersToManage - 服务器数量:', chromaServers.length);
    console.log('loadChromaServersToManage - 服务器列表:', chromaServers);
    
    elements.manageServerSelect.innerHTML = '<option value="">选择服务器...</option>';
    elements.captureServer.innerHTML = '<option value="">选择服务器...</option>';
    elements.searchServer.innerHTML = '<option value="">选择服务器...</option>';
    elements.uploadServer.innerHTML = '<option value="">选择服务器...</option>';
    
    chromaServers.forEach(server => {
        // 管理页面
        const manageOption = document.createElement('option');
        manageOption.value = server.url;
        manageOption.textContent = server.name;
        if (server.url === currentSettings.chromaUrl) {
            manageOption.selected = true;
        }
        elements.manageServerSelect.appendChild(manageOption);
        
        // 捕获页面
        const captureOption = document.createElement('option');
        captureOption.value = server.url;
        captureOption.textContent = server.name;
        if (server.url === currentSettings.chromaUrl) {
            captureOption.selected = true;
        }
        elements.captureServer.appendChild(captureOption);
        
        // 搜索页面
        const searchOption = document.createElement('option');
        searchOption.value = server.url;
        searchOption.textContent = server.name;
        if (server.url === currentSettings.chromaUrl) {
            searchOption.selected = true;
        }
        elements.searchServer.appendChild(searchOption);

        // 上传页面
        const uploadOption = document.createElement('option');
        uploadOption.value = server.url;
        uploadOption.textContent = server.name;
        if (server.url === currentSettings.chromaUrl) {
            uploadOption.selected = true;
        }
        elements.uploadServer.appendChild(uploadOption);
    });
    
    console.log('loadChromaServersToManage - 选项数量:', elements.manageServerSelect.options.length);
    
    // 默认选择当前设置的服务器，并加载其集合
    if (currentSettings.chromaUrl) {
        updateCollectionsForServer('capture', currentSettings.chromaUrl);
        updateCollectionsForServer('search', currentSettings.chromaUrl);
        loadCollectionsForUploadServer(currentSettings.chromaUrl);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 标签页切换
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // 捕获按钮
    elements.captureBtn.addEventListener('click', capturePage);
    elements.captureSelectionBtn.addEventListener('click', captureSelection);

    // 搜索按钮
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // 管理按钮
    elements.loadCollectionsBtn.addEventListener('click', loadChromaCollections);
    elements.createCollectionBtn.addEventListener('click', createChromaCollection);
    elements.removeDuplicatesBtn.addEventListener('click', removeDuplicates);
    elements.manageCollectionSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            loadContentList(e.target.value);
        }
    });
    elements.refreshContentBtn.addEventListener('click', () => {
        const collection = elements.manageCollectionSelect.value;
        if (collection) {
            loadContentList(collection);
        }
    });
    elements.clearAllContentBtn.addEventListener('click', clearAllContent);

    // 设置按钮
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);
    elements.embeddingModel.addEventListener('change', (e) => {
        elements.customModelGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
    
    // ChromaDB 服务器管理
    elements.addChromaServerBtn.addEventListener('click', addChromaServer);
    elements.chromaUrlSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            elements.chromaUrl.value = e.target.value;
        }
    });
    
    // 集合管理
    elements.manageServerSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            loadChromaCollections();
        }
    });
    elements.cancelRenameBtn.addEventListener('click', () => {
        elements.renameCollectionModal.classList.add('hidden');
    });
    elements.confirmRenameBtn.addEventListener('click', confirmRenameCollection);

    // 捕获和搜索的服务器选择
    elements.captureServer.addEventListener('change', (e) => {
        const selectedServer = chromaServers.find(s => s.url === e.target.value);
        if (selectedServer) {
            elements.captureServerUrl.textContent = selectedServer.url;
        } else {
            elements.captureServerUrl.textContent = '选择 ChromaDB 服务器';
        }
        updateCollectionsForServer('capture', e.target.value);
    });
    elements.searchServer.addEventListener('change', (e) => {
        const selectedServer = chromaServers.find(s => s.url === e.target.value);
        if (selectedServer) {
            elements.searchServerUrl.textContent = selectedServer.url;
        } else {
            elements.searchServerUrl.textContent = '选择 ChromaDB 服务器';
        }
        updateCollectionsForServer('search', e.target.value);
    });
    
    // 集合多选下拉框点击事件
    elements.captureCollectionDisplay.addEventListener('click', () => toggleMultiSelectDropdown('capture'));
    elements.searchCollectionDisplay.addEventListener('click', () => toggleMultiSelectDropdown('search'));
    
    // 点击外部关闭下拉框
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.multi-select-container')) {
            elements.captureCollectionDropdown.classList.remove('show');
            elements.captureCollectionDisplay.parentElement.classList.remove('open');
            elements.searchCollectionDropdown.classList.remove('show');
            elements.searchCollectionDisplay.parentElement.classList.remove('open');
        }
    });

    // 连接测试
    elements.testOllamaBtn.addEventListener('click', testOllamaConnection);
    elements.testChromaBtn.addEventListener('click', testChromaConnection);
    
    // 模型加载
    elements.loadModelsBtn.addEventListener('click', loadOllamaModels);

    // 上传标签页
    elements.uploadServer.addEventListener('change', (e) => {
        loadCollectionsForUploadServer(e.target.value);
    });
    setupDropZone();
    elements.uploadBtn.addEventListener('click', uploadFile);
}

// 切换标签页
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    elements.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    // 如果切换到设置页面，确保加载最新的设置值（特别是嵌入模型）
    if (tabName === 'settings') {
        loadSettings();
    }
}

// 加载设置
async function loadSettings() {
    try {
        console.log('loadSettings - 开始加载设置');
        const settings = await Storage.getSettings();
        currentSettings = { ...currentSettings, ...settings };
        console.log('loadSettings - 加载的设置:', currentSettings);
        
        if (elements.ollamaUrl) {
            elements.ollamaUrl.value = currentSettings.ollamaUrl;
        }
        if (elements.chromaUrl) {
            elements.chromaUrl.value = currentSettings.chromaUrl;
        }
        if (elements.embeddingModel) {
            // 保存当前选择的值
            const currentValue = elements.embeddingModel.value;
            
            // 检查保存的模型值是否在选项列表中
            const modelValue = currentSettings.embeddingModel || '';
            const exists = Array.from(elements.embeddingModel.options).some(
                opt => opt.value === modelValue
            );
            
            console.log('loadSettings - 保存的模型值:', modelValue);
            console.log('loadSettings - 模型是否存在于选项列表:', exists);
            
            if (modelValue && !exists) {
                // 如果模型不在选项列表中，添加它
                const option = document.createElement('option');
                option.value = modelValue;
                option.textContent = modelValue;
                elements.embeddingModel.appendChild(option);
                console.log('loadSettings - 添加新模型选项:', modelValue);
            }
            
            // 设置选中的值
            elements.embeddingModel.value = modelValue;
            console.log('loadSettings - 设置嵌入模型值为:', elements.embeddingModel.value);
        }
        if (elements.customModel) {
            elements.customModel.value = currentSettings.customModel || '';
        }
        if (elements.collectionName) {
            elements.collectionName.value = currentSettings.collectionName;
        }
        
        if (currentSettings.embeddingModel === 'custom' && elements.customModelGroup) {
            elements.customModelGroup.style.display = 'block';
        } else if (elements.customModelGroup) {
            elements.customModelGroup.style.display = 'none';
        }
    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

// 加载 ChromaDB 服务器列表
async function loadChromaServers() {
    try {
        const data = await chrome.storage.local.get(['chromaServers']);
        chromaServers = data.chromaServers || [];
        
        // 如果列表为空，添加默认服务器
        if (chromaServers.length === 0) {
            chromaServers = [
                { url: 'http://localhost:8000', name: '本地服务器' }
            ];
            await chrome.storage.local.set({ chromaServers });
        }
        
        updateChromaServerUI();
    } catch (error) {
        console.error('加载 ChromaDB 服务器列表失败:', error);
    }
}

// 更新 ChromaDB 服务器 UI
function updateChromaServerUI() {
    console.log('Updating ChromaDB server UI, servers:', chromaServers.length);
    
    // 更新下拉选择框
    elements.chromaUrlSelect.innerHTML = '<option value="">选择服务器...</option>';
    chromaServers.forEach((server, index) => {
        const option = document.createElement('option');
        option.value = server.url;
        option.textContent = `${server.name} (${server.url})`;
        if (server.url === currentSettings.chromaUrl) {
            option.selected = true;
        }
        elements.chromaUrlSelect.appendChild(option);
    });
    
    // 更新服务器列表显示
    const serverList = elements.chromaServerList.querySelector('.server-list');
    if (!serverList) {
        console.error('Server list container not found');
        return;
    }
    
    if (chromaServers.length > 0) {
        elements.chromaServerList.style.display = 'block';
        serverList.innerHTML = chromaServers.map((server, index) => `
            <div class="server-item" data-index="${index}">
                <div class="server-info">
                    <strong>${escapeHtml(server.name)}</strong>
                    <small>${escapeHtml(server.url)}</small>
                </div>
                <button class="btn btn-danger btn-sm server-delete-btn">删除</button>
            </div>
        `).join('');
        
        // 添加删除按钮的事件监听器
        serverList.querySelectorAll('.server-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.server-item').dataset.index);
                removeChromaServer(index);
            });
        });
    } else {
        elements.chromaServerList.style.display = 'none';
    }
}

// 添加 ChromaDB 服务器
async function addChromaServer() {
    const url = elements.newChromaUrl.value.trim();
    
    if (!url) {
        alert('请输入服务器地址');
        return;
    }
    
    // 检查是否已存在
    if (chromaServers.some(server => server.url === url)) {
        alert('该服务器已存在');
        return;
    }
    
    // 添加到列表
    chromaServers.push({
        url: url,
        name: `服务器 ${chromaServers.length + 1}`
    });
    
    // 保存到存储
    await chrome.storage.local.set({ chromaServers });
    
    // 更新设置页面的 UI
    updateChromaServerUI();
    
    // 更新所有页面的服务器选择器
    loadChromaServersToManage();
    
    // 立即刷新所有页面的服务器选择器，选择新添加的服务器
    refreshAllServerSelectors(url);
    
    // 加载新服务器的集合
    updateCollectionsForServer('capture', url);
    updateCollectionsForServer('search', url);
    
    // 清空输入框
    elements.newChromaUrl.value = '';
    
    showStatus(elements.settingsStatus, '服务器已添加', 'success');
}

// 删除 ChromaDB 服务器
async function removeChromaServer(index) {
    console.log('Removing ChromaDB server at index:', index);
    
    const server = chromaServers[index];
    if (!server) {
        console.error('Server not found at index:', index);
        return;
    }
    
    if (!confirm(`确定要删除服务器 "${server.name}" 吗？`)) {
        return;
    }
    
    // 从列表中删除
    chromaServers.splice(index, 1);

    // 保存到存储
    await chrome.storage.local.set({ chromaServers });

    // 从分组中移除该服务器的集合
            delete chromaCollectionsByServer[server.url];
    
            // 删除该服务器的选择记录
            delete selectedCaptureCollectionsByServer[server.url];
            delete selectedSearchCollectionsByServer[server.url];
    
            // 更新全局集合列表
            chromaCollections = Object.values(chromaCollectionsByServer).flat();
    
            // 更新 UI
            updateChromaServerUI();
    
            // 更新管理页面的服务器选择器
            loadChromaServersToManage();
    
            // 更新捕获和搜索页面的多选下拉框
            updateMultiSelectDropdown('capture', chromaCollections);
            updateMultiSelectDropdown('search', chromaCollections);
    
            // 清空该服务器集合的选择
            selectedCaptureCollections = [];
            selectedSearchCollections = [];
            updateMultiSelectDisplay('capture');
            updateMultiSelectDisplay('search');
            saveSelectedCollections();
    // 如果删除的是当前选中的服务器，选择第一个服务器
    if (server.url === currentSettings.chromaUrl && chromaServers.length > 0) {
        elements.chromaUrlSelect.value = chromaServers[0].url;
        elements.chromaUrl.value = chromaServers[0].url;
    }
    
    showStatus(elements.settingsStatus, '服务器已删除', 'success');
}

// 加载 ChromaDB 集合列表
async function loadChromaCollections() {
    const url = elements.manageServerSelect.value.trim();
    
    if (!url) {
        elements.collectionList.innerHTML = '<div class="empty-state">请先选择服务器</div>';
        return;
    }
    
    try {
        elements.loadCollectionsBtn.disabled = true;
        const originalContent = elements.loadCollectionsBtn.innerHTML;
        elements.loadCollectionsBtn.innerHTML = '<span class="btn-icon">⏳</span>加载中...';
        
        const collections = await ChromaDBClient.getCollections(url);
        
        // 按服务器分组存储
        chromaCollectionsByServer[url] = collections || [];
        
        // 更新管理页面的 UI（只显示选中服务器的集合）
        updateCollectionHierarchyUI();
        
        // 更新全局集合列表（用于捕获和搜索）- 包含所有服务器的集合
        chromaCollections = Object.values(chromaCollectionsByServer).flat();
        
        // 更新集合 UI（管理页面的下拉框只显示当前服务器的集合）
        updateCollectionUI(url);
        
        // 更新多选下拉框（显示所有服务器的集合）
        updateMultiSelectDropdown('capture', chromaCollections);
        updateMultiSelectDropdown('search', chromaCollections);

        // 同步上传页面的集合列表
        if (elements.uploadServer && elements.uploadServer.value) {
            loadCollectionsForUploadServer(elements.uploadServer.value);
        }
    } catch (error) {
        console.error('加载集合失败:', error);
        elements.collectionList.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
    } finally {
        elements.loadCollectionsBtn.disabled = false;
        elements.loadCollectionsBtn.innerHTML = '<span class="btn-icon">🔄</span>刷新集合列表';
    }
}

// 创建 ChromaDB 集合
async function createChromaCollection() {
    const url = elements.manageServerSelect.value.trim();
    const name = elements.newCollectionName.value.trim();
    
    if (!url) {
        alert('请先选择服务器');
        return;
    }
    
    if (!name) {
        alert('请输入集合名称');
        return;
    }
    
    // 检查名称是否已存在（在当前服务器中）
    const currentCollections = chromaCollectionsByServer[url] || [];
    if (currentCollections.some(c => c.name === name)) {
        alert('该集合已存在');
        return;
    }
    
    try {
        elements.createCollectionBtn.disabled = true;
        const originalContent = elements.createCollectionBtn.innerHTML;
        elements.createCollectionBtn.innerHTML = '<span class="btn-icon">⏳</span>创建中...';
        
        await ChromaDBClient.createCollection(url, name);
        
        // 重新加载集合列表
        await loadChromaCollections();
        
        // 清空输入框
        elements.newCollectionName.value = '';
        
        alert('集合创建成功');
    } catch (error) {
        console.error('创建集合失败:', error);
        alert(`创建集合失败: ${error.message}`);
    } finally {
        elements.createCollectionBtn.disabled = false;
        elements.createCollectionBtn.innerHTML = '<span class="btn-icon">➕</span>创建';
    }
}

// 更新集合层级 UI
function updateCollectionHierarchyUI() {
    // 获取当前选中的服务器
    const selectedServerUrl = elements.manageServerSelect.value.trim();
    
    if (!selectedServerUrl) {
        elements.collectionList.innerHTML = '<div class="empty-state">请先选择服务器</div>';
        return;
    }
    
    // 获取选中服务器的集合
    const collections = chromaCollectionsByServer[selectedServerUrl] || [];
    
    if (collections.length === 0) {
        elements.collectionList.innerHTML = '<div class="empty-state">该服务器暂无集合，请创建新集合</div>';
        return;
    }
    
    const serverName = chromaServers.find(s => s.url === selectedServerUrl)?.name || selectedServerUrl;
    
    let html = `
        <div class="server-group">
            <div class="server-group-header">
                <div class="server-info">
                    <span class="server-name">${escapeHtml(serverName)}</span>
                    <span class="server-url">${escapeHtml(selectedServerUrl)}</span>
                </div>
                <span class="collection-count">${collections.length} 个集合</span>
            </div>
            <div class="server-group-content expanded">
                ${collections.map(collection => `
                    <div class="collection-item" data-server="${selectedServerUrl}" data-name="${collection.name}" data-id="${collection.id}">
                        <div class="collection-info">
                            <div class="collection-name">${escapeHtml(collection.name)}</div>
                            <div class="collection-id">ID: ${escapeHtml(collection.id || 'N/A')}</div>
                        </div>
                        <div class="collection-actions">
                            <button class="btn btn-secondary btn-sm collection-rename-btn" title="重命名">
                                <span class="btn-icon">✏️</span>
                            </button>
                            <button class="btn btn-danger btn-sm collection-delete-btn" title="删除">
                                <span class="btn-icon">🗑️</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    elements.collectionList.innerHTML = html;
    
    // 添加事件监听器
    elements.collectionList.querySelectorAll('.collection-rename-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.target.closest('.collection-item');
            const serverUrl = item.dataset.server;
            const collectionName = item.dataset.name;
            showRenameModal(serverUrl, collectionName);
        });
    });
    
    elements.collectionList.querySelectorAll('.collection-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.target.closest('.collection-item');
            const serverUrl = item.dataset.server;
            const collectionName = item.dataset.name;
            deleteChromaCollection(serverUrl, collectionName);
        });
    });
}

// 切换服务器组展开/折叠
function toggleServerGroup(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    content.classList.toggle('expanded');
    icon.textContent = content.classList.contains('expanded') ? '▼' : '▶';
}

// 显示重命名模态框
function showRenameModal(serverUrl, collectionName) {
    currentRenameCollection = { serverUrl, collectionName };
    elements.newCollectionNameInput.value = collectionName;
    elements.renameCollectionModal.classList.remove('hidden');
    elements.newCollectionNameInput.focus();
}

// 确认重命名集合
async function confirmRenameCollection() {
    if (!currentRenameCollection) return;
    
    const newName = elements.newCollectionNameInput.value.trim();
    
    if (!newName) {
        alert('请输入新的集合名称');
        return;
    }
    
    if (newName === currentRenameCollection.collectionName) {
        elements.renameCollectionModal.classList.add('hidden');
        return;
    }
    
    try {
        // ChromaDB 不支持直接重命名，需要创建新集合并迁移数据
        // 这里我们只创建新集合，数据迁移需要用户手动处理
        await ChromaDBClient.createCollection(currentRenameCollection.serverUrl, newName);
        
        alert(`新集合 "${newName}" 已创建。请注意，原集合 "${currentRenameCollection.collectionName}" 的数据需要手动迁移。`);
        
        elements.renameCollectionModal.classList.add('hidden');
        
        // 重新加载集合列表
        await loadChromaCollections();
    } catch (error) {
        console.error('重命名集合失败:', error);
        alert(`重命名失败: ${error.message}`);
    }
}

// 删除 ChromaDB 集合
async function deleteChromaCollection(serverUrl, collectionName) {
    console.log('Deleting ChromaDB collection:', collectionName, 'from server:', serverUrl);
    
    if (!confirm(`确定要删除集合 "${collectionName}" 吗？这将删除集合中的所有数据！`)) {
        return;
    }
    
    try {
        // 清除缓存
        ChromaDBClient.collectionCache.delete(collectionName);
        
        await ChromaDBClient.deleteCollection(serverUrl, collectionName);
        
        // 从分组中移除
        if (chromaCollectionsByServer[serverUrl]) {
            chromaCollectionsByServer[serverUrl] = chromaCollectionsByServer[serverUrl].filter(
                c => c.name !== collectionName
            );
        }

        // 更新全局集合列表
        chromaCollections = Object.values(chromaCollectionsByServer).flat();

        // 重新加载集合列表
        updateCollectionHierarchyUI();
        updateCollectionUI(serverUrl);

        // 更新捕获和搜索页面的多选下拉框
        updateMultiSelectDropdown('capture', chromaCollections);
        updateMultiSelectDropdown('search', chromaCollections);

        // 同步上传页面的集合列表
        if (elements.uploadServer && elements.uploadServer.value) {
            loadCollectionsForUploadServer(elements.uploadServer.value);
        }

        // 清空被删除集合的选择（从按服务器分组的选择中移除）
        if (selectedCaptureCollectionsByServer[serverUrl]) {
            selectedCaptureCollectionsByServer[serverUrl] = selectedCaptureCollectionsByServer[serverUrl].filter(c => c !== collectionName);
        }
        if (selectedSearchCollectionsByServer[serverUrl]) {
            selectedSearchCollectionsByServer[serverUrl] = selectedSearchCollectionsByServer[serverUrl].filter(c => c !== collectionName);
        }

        // 更新当前选择
        selectedCaptureCollections = selectedCaptureCollections.filter(c => c !== collectionName);
        selectedSearchCollections = selectedSearchCollections.filter(c => c !== collectionName);
        updateMultiSelectDisplay('capture');
        updateMultiSelectDisplay('search');
        saveSelectedCollections();
        
        alert('集合删除成功');
    } catch (error) {
        console.error('删除集合失败:', error);
        alert(`删除集合失败: ${error.message}`);
    }
}

// 加载内容列表
async function loadContentList(collectionName) {
    if (!collectionName) {
        elements.contentList.innerHTML = '<div class="empty-state">请先选择一个集合</div>';
        return;
    }
    
    // 获取管理页面选择的服务器 URL
    const serverUrl = elements.manageServerSelect.value.trim();
    
    if (!serverUrl) {
        elements.contentList.innerHTML = '<div class="empty-state">请先选择服务器</div>';
        return;
    }
    
    try {
        elements.contentList.innerHTML = '<div class="loading">加载中...</div>';
        
        console.log(`加载内容列表 - 服务器: ${serverUrl}, 集合: ${collectionName}`);
        
        const results = await ChromaDBClient.getDocuments(
            serverUrl,
            collectionName,
            { limit: 100 }
        );
        
        console.log(`加载内容列表成功 - 文档数量: ${results?.documents?.length || 0}`);
        
        if (!results || !results.documents || results.documents.length === 0) {
            elements.contentList.innerHTML = '<div class="empty-state">该集合中没有内容</div>';
            return;
        }
        
        elements.contentList.innerHTML = results.documents.map((doc, index) => {
            const metadata = results.metadatas[index] || {};
            const id = results.ids[index];
            
            return `
                <div class="manage-item" data-id="${id}" data-collection="${collectionName}" data-server="${serverUrl}">
                    <div class="manage-item-info">
                        <div class="manage-item-title">${escapeHtml(metadata.title || '无标题')}</div>
                        <div class="manage-item-url">${escapeHtml(metadata.url || '未知 URL')}</div>
                        <div class="manage-item-date">${metadata.timestamp ? new Date(metadata.timestamp).toLocaleString('zh-CN') : '未知时间'}</div>
                    </div>
                    <div class="manage-item-actions">
                        <button class="btn btn-danger btn-sm content-delete-btn">删除</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // 添加删除按钮的事件监听器
        elements.contentList.querySelectorAll('.content-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.manage-item');
                const id = item.dataset.id;
                const collection = item.dataset.collection;
                const server = item.dataset.server;
                deleteContent(server, collection, id);
            });
        });
    } catch (error) {
        console.error('加载内容列表失败:', error);
        elements.contentList.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
    }
}

// 删除内容
async function deleteContent(serverUrl, collectionName, docId) {
    if (!confirm('确定要删除这条内容吗？')) {
        return;
    }
    
    try {
        await ChromaDBClient.deleteDocument(serverUrl, collectionName, docId);
        
        // 重新加载列表
        await loadContentList(collectionName);
        
        alert('删除成功');
    } catch (error) {
        console.error('删除内容失败:', error);
        alert(`删除失败: ${error.message}`);
    }
}

// 更新集合 UI
function updateCollectionUI(serverUrl = null) {
    console.log('Updating collection UI, collections:', chromaCollections.length);
    
    // 如果指定了服务器 URL，只显示该服务器的集合
    const collectionsToShow = serverUrl 
        ? (chromaCollectionsByServer[serverUrl] || [])
        : chromaCollections;
    
    console.log('Collections to show:', collectionsToShow.length);
    
    // 更新管理页面的下拉选择框
    elements.manageCollectionSelect.innerHTML = '<option value="">选择集合...</option>';
    collectionsToShow.forEach(collection => {
        const option = document.createElement('option');
        option.value = collection.name;
        option.textContent = collection.name;
        if (collection.name === currentSettings.collectionName) {
            option.selected = true;
        }
        elements.manageCollectionSelect.appendChild(option);
    });
}

// 更新特定服务器的集合（用于捕获和搜索页面）
async function updateCollectionsForServer(type, serverUrl) {
    if (!serverUrl) {
        // 如果没有选择服务器，清空集合列表
        updateMultiSelectDropdown(type, []);
        // 清空选择
        if (type === 'capture') {
            selectedCaptureCollections = [];
        } else {
            selectedSearchCollections = [];
        }
        updateMultiSelectDisplay(type);
        saveSelectedCollections();
        return;
    }

    // 检查是否已经加载了该服务器的集合
    if (chromaCollectionsByServer[serverUrl]) {
        const collections = chromaCollectionsByServer[serverUrl];
        updateMultiSelectDropdown(type, collections);

        // 获取该服务器上次的选择
        if (type === 'capture') {
            selectedCaptureCollections = selectedCaptureCollectionsByServer[serverUrl] || [];
        } else {
            selectedSearchCollections = selectedSearchCollectionsByServer[serverUrl] || [];
        }

        // 过滤掉不存在的集合
        const collectionNames = collections.map(c => c.name);
        if (type === 'capture') {
            selectedCaptureCollections = selectedCaptureCollections.filter(name => collectionNames.includes(name));
        } else {
            selectedSearchCollections = selectedSearchCollections.filter(name => collectionNames.includes(name));
        }

        // 如果没有选择且集合不为空，默认选择第一个
        if ((type === 'capture' ? selectedCaptureCollections : selectedSearchCollections).length === 0 && collections.length > 0) {
            if (type === 'capture') {
                selectedCaptureCollections = [collections[0].name];
            } else {
                selectedSearchCollections = [collections[0].name];
            }
        }

        updateMultiSelectDisplay(type);
        saveSelectedCollections();
        return;
    }

    // 如果没有加载，尝试加载
    try {
        const collections = await ChromaDBClient.getCollections(serverUrl);
        chromaCollectionsByServer[serverUrl] = collections || [];
        updateMultiSelectDropdown(type, collections);

        // 获取该服务器上次的选择
        if (type === 'capture') {
            selectedCaptureCollections = selectedCaptureCollectionsByServer[serverUrl] || [];
        } else {
            selectedSearchCollections = selectedSearchCollectionsByServer[serverUrl] || [];
        }

        // 过滤掉不存在的集合
        const collectionNames = collections.map(c => c.name);
        if (type === 'capture') {
            selectedCaptureCollections = selectedCaptureCollections.filter(name => collectionNames.includes(name));
        } else {
            selectedSearchCollections = selectedSearchCollections.filter(name => collectionNames.includes(name));
        }

        // 如果没有选择且集合不为空，默认选择第一个
        if ((type === 'capture' ? selectedCaptureCollections : selectedSearchCollections).length === 0 && collections.length > 0) {
            if (type === 'capture') {
                selectedCaptureCollections = [collections[0].name];
            } else {
                selectedSearchCollections = [collections[0].name];
            }
        }

        updateMultiSelectDisplay(type);
        saveSelectedCollections();
    } catch (error) {
        console.error(`加载服务器 ${serverUrl} 的集合失败:`, error);
        updateMultiSelectDropdown(type, []);
        // 清空选择
        if (type === 'capture') {
            selectedCaptureCollections = [];
        } else {
            selectedSearchCollections = [];
        }
        updateMultiSelectDisplay(type);
        saveSelectedCollections();
    }
}

// 测试 Ollama 连接
async function testOllamaConnection() {
    const url = elements.ollamaUrl.value.trim();
    
    console.log('Testing Ollama connection to:', url);
    
    if (!url) {
        showTestStatus(elements.ollamaTestStatus, '请输入 Ollama 服务器地址', 'warning');
        return;
    }
    
    try {
        elements.testOllamaBtn.disabled = true;
        const originalContent = elements.testOllamaBtn.innerHTML;
        elements.testOllamaBtn.innerHTML = '<span class="btn-icon">⏳</span>测试中...';
        
        const result = await OllamaClient.testConnection(url);
        
        if (result.success) {
            const modelCount = result.models ? result.models.length : 0;
            showTestStatus(elements.ollamaTestStatus, 
                `✓ 连接成功！可用模型: ${modelCount} 个`, 
                'success');
            
            // 自动加载模型列表并选择第一个
            await loadOllamaModels();
        } else {
            throw new Error(result.message || '连接失败');
        }
    } catch (error) {
        console.error('Ollama 连接测试失败:', error);
        showTestStatus(elements.ollamaTestStatus, 
            `✗ 连接失败: ${error.message}`, 
            'error');
    } finally {
        elements.testOllamaBtn.disabled = false;
        elements.testOllamaBtn.innerHTML = '<span class="btn-icon">🔗</span>测试';
    }
}

// 测试 ChromaDB 连接
async function testChromaConnection() {
    const url = elements.chromaUrl.value.trim();
    
    console.log('Testing ChromaDB connection to:', url);
    
    if (!url) {
        showTestStatus(elements.chromaTestStatus, '请先选择 ChromaDB 服务器', 'warning');
        return;
    }
    
    try {
        elements.testChromaBtn.disabled = true;
        const originalContent = elements.testChromaBtn.innerHTML;
        elements.testChromaBtn.innerHTML = '<span class="btn-icon">⏳</span>测试中...';
        
        const result = await ChromaDBClient.testConnection(url);
        
        if (result.success) {
            const collectionCount = result.collections ? result.collections.length : 0;
            showTestStatus(elements.chromaTestStatus, 
                `✓ 连接成功！集合数: ${collectionCount} 个`, 
                'success');
        } else {
            throw new Error(result.message || '连接失败');
        }
    } catch (error) {
        console.error('ChromaDB 连接测试失败:', error);
        showTestStatus(elements.chromaTestStatus, 
            `✗ 连接失败: ${error.message}`, 
            'error');
    } finally {
        elements.testChromaBtn.disabled = false;
        elements.testChromaBtn.innerHTML = '<span class="btn-icon">🔗</span>测试';
    }
}

// 加载 Ollama 模型列表
async function loadOllamaModels() {
    const url = elements.ollamaUrl.value.trim();
    
    console.log('Loading Ollama models from:', url);
    
    if (!url) {
        showTestStatus(elements.ollamaTestStatus, '请输入 Ollama 服务器地址', 'warning');
        return;
    }
    
    try {
        elements.loadModelsBtn.disabled = true;
        const originalContent = elements.loadModelsBtn.innerHTML;
        elements.loadModelsBtn.innerHTML = '<span class="btn-icon">⏳</span>加载中...';
        
        const models = await OllamaClient.getModels(url);
        
        if (models && models.length > 0) {
            // 保存当前的选中值
            const currentValue = elements.embeddingModel.value;
            console.log('当前选中的模型:', currentValue);
            
            // 清空并重新填充模型列表
            elements.embeddingModel.innerHTML = '<option value="">选择模型...</option>';
            
            // 过滤出嵌入模型（包含 'embed' 的模型）
            const embeddingModels = models.filter(model => 
                model.name && model.name.toLowerCase().includes('embed')
            );
            
            console.log('找到的嵌入模型数量:', embeddingModels.length);
            
            if (embeddingModels.length > 0) {
                embeddingModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    elements.embeddingModel.appendChild(option);
                });
                console.log('添加的嵌入模型:', embeddingModels.map(m => m.name));
                
                // 恢复选中值（如果仍然存在）
                const exists = Array.from(elements.embeddingModel.options).some(
                    opt => opt.value === currentValue
                );
                if (exists) {
                    elements.embeddingModel.value = currentValue;
                    console.log('恢复选中模型:', currentValue);
                } else if (!currentValue) {
                    // 如果没有当前值，选择第一个模型
                    elements.embeddingModel.selectedIndex = 1;
                    currentSettings.embeddingModel = elements.embeddingModel.value;
                    console.log('默认选择第一个模型:', elements.embeddingModel.value);
                }
            } else {
                // 如果没有找到嵌入模型，显示所有模型
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    elements.embeddingModel.appendChild(option);
                });
                
                // 恢复选中值（如果仍然存在）
                const exists = Array.from(elements.embeddingModel.options).some(
                    opt => opt.value === currentValue
                );
                if (exists) {
                    elements.embeddingModel.value = currentValue;
                } else if (!currentValue) {
                    elements.embeddingModel.selectedIndex = 1;
                    currentSettings.embeddingModel = elements.embeddingModel.value;
                }
            }
            
            showTestStatus(elements.ollamaTestStatus, 
                `加载成功！找到 ${models.length} 个模型`, 
                'success');
        } else {
            showTestStatus(elements.ollamaTestStatus, 
                '未找到任何模型，请确保 Ollama 已安装模型', 
                'warning');
        }
    } catch (error) {
        console.error('加载模型失败:', error);
        showTestStatus(elements.ollamaTestStatus, 
            `加载模型失败: ${error.message}`, 
            'error');
    } finally {
        elements.loadModelsBtn.disabled = false;
        elements.loadModelsBtn.innerHTML = '<span class="btn-icon">🔄</span>加载模型';
    }
}

// 保存设置
async function saveSettings() {
    try {
        if (!elements.ollamaUrl || !elements.chromaUrl || !elements.embeddingModel) {
            throw new Error('必要的表单元素未找到');
        }
        
        const newSettings = {
            ollamaUrl: elements.ollamaUrl.value.trim(),
            chromaUrl: elements.chromaUrl.value.trim(),
            embeddingModel: elements.embeddingModel.value,
            customModel: elements.customModel ? elements.customModel.value.trim() : '',
            collectionName: currentSettings.collectionName || 'webpages'
        };

        await Storage.saveSettings(newSettings);
        currentSettings = newSettings;
        
        showStatus(elements.settingsStatus, '设置已保存', 'success');
    } catch (error) {
        console.error('保存设置失败:', error);
        showStatus(elements.settingsStatus, '保存设置失败: ' + error.message, 'error');
    }
}

// 重置设置
async function resetSettings() {
    const defaultSettings = {
        ollamaUrl: 'http://localhost:11434',
        chromaUrl: 'http://localhost:8000',
        embeddingModel: 'nomic-embed-text',
        customModel: '',
        collectionName: 'webpages'
    };

    elements.ollamaUrl.value = defaultSettings.ollamaUrl;
    elements.chromaUrl.value = defaultSettings.chromaUrl;
    elements.embeddingModel.value = defaultSettings.embeddingModel;
    elements.customModel.value = defaultSettings.customModel;
    elements.collectionName.value = defaultSettings.collectionName;
    elements.customModelGroup.style.display = 'none';

    await saveSettings();
}

// 显示状态消息
function showStatus(statusElement, message, type = 'info') {
    statusElement.classList.remove('hidden', 'success', 'error', 'warning');
    statusElement.classList.add(type);
    statusElement.querySelector('.status-message').textContent = message;
    
    setTimeout(() => {
        statusElement.classList.add('hidden');
    }, 5000);
}

// 显示测试状态
function showTestStatus(statusElement, message, type = 'info') {
    statusElement.classList.remove('hidden', 'success', 'error', 'warning');
    statusElement.classList.add(type);
    statusElement.textContent = message;
    
    // 5秒后自动隐藏
    setTimeout(() => {
        statusElement.classList.add('hidden');
    }, 5000);
}

// 显示进度
function showProgress(statusElement, message) {
    statusElement.classList.remove('hidden');
    statusElement.querySelector('.status-message').textContent = message;
    statusElement.querySelector('.progress-bar').classList.remove('hidden');
}

// 更新进度
function updateProgress(statusElement, percent) {
    statusElement.querySelector('.progress-fill').style.width = percent + '%';
}

// 隐藏进度
function hideProgress(statusElement) {
    statusElement.querySelector('.progress-bar').classList.add('hidden');
}

// 捕获选择内容
async function captureSelection() {
    console.log('=== 开始捕获选择内容 ===');
    
    try {
        // 获取选中的服务器 URL
        const serverUrl = elements.captureServer.value.trim();
        if (!serverUrl) {
            throw new Error('请先选择服务器');
        }
        
        elements.captureSelectionBtn.disabled = true;
        showProgress(elements.captureStatus, '正在提取选择内容...');

        updateProgress(elements.captureStatus, 10);

        // 获取当前标签页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('当前标签页:', tab);
        if (!tab) {
            throw new Error('无法获取当前标签页');
        }

        updateProgress(elements.captureStatus, 20);

        // 检查标签页是否可以注入脚本
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://'))) {
            throw new Error('无法捕获 Chrome 系统页面');
        }

        // 尝试向内容脚本发送消息获取选择内容
        let response;
        try {
            console.log('尝试获取选择内容...');
            response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
            console.log('选择内容响应:', response);
        } catch (messageError) {
            console.log('Content script 未加载，尝试注入...', messageError);
            // 如果消息发送失败，尝试注入 content script
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content-scripts/content-script.js']
                });
                
                // 等待一小段时间让脚本初始化
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 再次尝试获取选择内容
                response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
                console.log('注入后选择内容响应:', response);
            } catch (injectError) {
                console.error('注入 content script 失败:', injectError);
                throw new Error('注入内容脚本失败，请刷新页面后重试');
            }
        }
        
        if (!response || !response.success) {
            if (response && response.error) {
                throw response.error;
            }
            throw new Error('没有选择内容，请先在页面中选择文本');
        }

        if (!response.content || response.content.trim().length === 0) {
            throw new Error('选择内容为空，请先在页面中选择文本');
        }

        console.log('选择内容提取成功，长度:', response.content?.length);
        updateProgress(elements.captureStatus, 40);

        // 获取用户选择的 collection
        if (selectedCaptureCollections.length === 0) {
            throw new Error('请先选择至少一个集合');
        }
        console.log('选择的集合:', selectedCaptureCollections);

        // 生成向量嵌入
        console.log('=== 开始生成向量嵌入 ===');
        console.log('Ollama URL:', currentSettings.ollamaUrl);
        console.log('嵌入模型:', currentSettings.embeddingModel);
        console.log('自定义模型:', currentSettings.customModel);
        showProgress(elements.captureStatus, '正在分块并生成向量嵌入...');
        const model = currentSettings.embeddingModel === 'custom' 
            ? currentSettings.customModel 
            : currentSettings.embeddingModel;
        
        console.log('使用的模型:', model);
        
        const chunks = splitIntoChunks(response.content, 4000, 200);
        console.log(`选择内容分为 ${chunks.length} 个块`);
        
        const baseDocId = generateDocId(tab.url + '-selection-' + Date.now());
        
        for (let i = 0; i < chunks.length; i++) {
            const pct = 40 + ((i + 1) / chunks.length) * 50;
            showProgress(elements.captureStatus, 
                chunks.length > 1 
                    ? `正在处理第 ${i + 1}/${chunks.length} 块...` 
                    : `正在生成向量库嵌入...`
            );
            updateProgress(elements.captureStatus, Math.round(pct));

            const chunkText = chunks[i];
            const embedding = await OllamaClient.generateEmbedding(
                currentSettings.ollamaUrl,
                chunkText,
                model
            );
            
            const chunkId = chunks.length > 1 ? `${baseDocId}-chunk-${i}` : baseDocId;

            for (const collectionName of selectedCaptureCollections) {
                await ChromaDBClient.addDocument(
                    serverUrl,
                    collectionName,
                    {
                        id: chunkId,
                        content: chunkText,
                        metadata: {
                            url: tab.url,
                            title: tab.title,
                            timestamp: new Date().toISOString(),
                            type: 'selection',
                            chunk: i,
                            totalChunks: chunks.length
                        },
                        embedding: embedding
                    }
                );
            }
        }
        
        updateProgress(elements.captureStatus, 90);

        // 保存元数据到本地存储
        await Storage.addCapturedPage({
            id: baseDocId,
            url: tab.url,
            title: tab.title,
            timestamp: new Date().toISOString(),
            type: 'selection'
        });

        updateProgress(elements.captureStatus, 100);

        // 显示成功消息
        showStatus(elements.captureStatus, '选择内容捕获成功！', 'success');
        
        // 5秒后自动隐藏
        setTimeout(() => {
            elements.captureStatus.classList.add('hidden');
        }, 5000);
    } catch (error) {
        console.error('捕获选择内容失败:', error);
        showStatus(elements.captureStatus, `捕获失败: ${error.message}`, 'error');
    } finally {
        elements.captureSelectionBtn.disabled = false;
        hideProgress(elements.captureStatus);
    }
}

// 捕获页面
async function capturePage() {
    console.log('=== 开始捕获页面 ===');
    
    try {
        // 获取选中的服务器 URL
        const serverUrl = elements.captureServer.value.trim();
        if (!serverUrl) {
            throw new Error('请先选择服务器');
        }
        
        elements.captureBtn.disabled = true;
        showProgress(elements.captureStatus, '正在提取页面内容...');
        updateProgress(elements.captureStatus, 10);

        // 获取当前标签页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('当前标签页:', tab);
        if (!tab) {
            throw new Error('无法获取当前标签页');
        }

        updateProgress(elements.captureStatus, 20);

        // 检查标签页是否可以注入脚本
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://'))) {
            throw new Error('无法捕获 Chrome 系统页面');
        }

        // 尝试向内容脚本发送消息
        let response;
        try {
            console.log('尝试发送消息到 content script...');
            response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
            console.log('Content script 响应:', response);
        } catch (messageError) {
            console.log('Content script 未加载，尝试注入...', messageError);
            // 如果消息发送失败，尝试注入 content script
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content-scripts/content-script.js']
                });
                
                // 等待一小段时间让脚本初始化
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 再次尝试发送消息
                response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
                console.log('注入后 Content script 响应:', response);
            } catch (injectError) {
                console.error('注入 content script 失败:', injectError);
                throw new Error('无法注入内容脚本，请刷新页面后重试');
            }
        }
        
        if (!response || !response.success) {
            const error = response?.error || new Error('提取页面内容失败');
            console.error('提取页面内容失败:', error);
            throw error;
        }

        console.log('页面内容提取成功，长度:', response.content?.length);
        updateProgress(elements.captureStatus, 40);

        // 清理 HTML 内容
        showProgress(elements.captureStatus, '正在清理内容...');
        const cleanedContent = HtmlCleaner.cleanHtml(response.content);
        console.log('清理后内容长度:', cleanedContent?.length);
        
        updateProgress(elements.captureStatus, 50);

        // 获取用户选择的 collection
        if (selectedCaptureCollections.length === 0) {
            throw new Error('请先选择至少一个集合');
        }
        console.log('选择的集合:', selectedCaptureCollections);

        // 生成向量嵌入
        console.log('=== 开始生成向量嵌入 ===');
        console.log('Ollama URL:', currentSettings.ollamaUrl);
        console.log('嵌入模型:', currentSettings.embeddingModel);
        console.log('自定义模型:', currentSettings.customModel);
        console.log('完整设置:', JSON.stringify(currentSettings, null, 2));
        showProgress(elements.captureStatus, '正在分块并生成向量嵌入...');
        const model = currentSettings.embeddingModel === 'custom' 
            ? currentSettings.customModel 
            : currentSettings.embeddingModel;
        
        console.log('使用的模型:', model);
        console.log('模型是否为空:', !model);
        
        const chunks = splitIntoChunks(cleanedContent, 4000, 200);
        console.log(`页面分为 ${chunks.length} 个块`);

        // 存储到 ChromaDB（支持多个集合）
        showProgress(elements.captureStatus, '正在检查重复内容...');
        const baseDocId = generateDocId(tab.url);
        // 使用第一块的 ID 检查重复
        const firstChunkId = chunks.length > 1 ? `${baseDocId}-chunk-0` : baseDocId;

        // Check for duplicate documents in each selected collection
        const existingCollections = [];
        for (const collectionName of selectedCaptureCollections) {
            try {
                // 检查 chunk-0 或 baseDocId 是否存在
                const exists = await ChromaDBClient.checkDocumentExists(serverUrl, collectionName, firstChunkId);
                // 向后兼容，如果有老版本的单块 baseDocId 也认为是重复
                const baseExists = chunks.length > 1 ? await ChromaDBClient.checkDocumentExists(serverUrl, collectionName, baseDocId) : false;
                if (exists || baseExists) existingCollections.push(collectionName);
            } catch (e) {
                console.warn(`检查集合 ${collectionName} 重复时出错:`, e);
            }
        }

        let updateMode = false;
        if (existingCollections.length > 0) {
            const collectionsStr = existingCollections.join('、');
            updateMode = confirm(
                `检测到重复内容！\n该页面已存在于以下集合中：\n${collectionsStr}\n\n点击"确定"更新已有内容，点击"取消"仅保存到新集合。`
            );
            // If all collections are duplicates and user chose not to update, abort
            const newCollections = selectedCaptureCollections.filter(c => !existingCollections.includes(c));
            if (!updateMode && newCollections.length === 0) {
                hideProgress(elements.captureStatus);
                showStatus(elements.captureStatus, '该页面已存在于所有选中的集合中，已取消保存', 'warning');
                return;
            }
        }

        showProgress(elements.captureStatus, '正在处理向量嵌入并保存...');
        
        for (let i = 0; i < chunks.length; i++) {
            const pct = 50 + ((i + 1) / chunks.length) * 40;
            showProgress(elements.captureStatus, 
                chunks.length > 1 
                    ? `正在处理第 ${i + 1}/${chunks.length} 块...` 
                    : `正在生成特征向量...`
            );
            updateProgress(elements.captureStatus, Math.round(pct));

            const chunkText = chunks[i];
            const embedding = await OllamaClient.generateEmbedding(
                currentSettings.ollamaUrl,
                chunkText,
                model
            );
            
            const chunkId = chunks.length > 1 ? `${baseDocId}-chunk-${i}` : baseDocId;

            for (const collectionName of selectedCaptureCollections) {
                const isDuplicate = existingCollections.includes(collectionName);
                if (isDuplicate && !updateMode) continue;
                
                const saveDoc = {
                    id: chunkId,
                    content: chunkText,
                    metadata: {
                        url: tab.url,
                        title: tab.title,
                        timestamp: new Date().toISOString(),
                        chunk: i,
                        totalChunks: chunks.length
                    },
                    embedding: embedding
                };
                
                if (isDuplicate) {
                    await ChromaDBClient.upsertDocument(serverUrl, collectionName, saveDoc);
                } else {
                    await ChromaDBClient.addDocument(serverUrl, collectionName, saveDoc);
                }
            }
        }
        
        updateProgress(elements.captureStatus, 90);

        // 保存元数据到本地存储
        await Storage.addCapturedPage({
            id: baseDocId,
            url: tab.url,
            title: tab.title,
            timestamp: new Date().toISOString()
        });

        updateProgress(elements.captureStatus, 100);
        hideProgress(elements.captureStatus);
        showStatus(elements.captureStatus, '页面已成功捕获并存储！', 'success');
    } catch (error) {
        console.error('捕获页面失败:', error);
        hideProgress(elements.captureStatus);
        showStatus(elements.captureStatus, '捕获失败: ' + error.message, 'error');
    } finally {
        elements.captureBtn.disabled = false;
    }
}

// 执行搜索
async function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) {
        showStatus(elements.searchResults, '请输入搜索查询', 'warning');
        return;
    }

    // 获取用户选择的 collection
    if (selectedSearchCollections.length === 0) {
        showStatus(elements.searchResults, '请先选择至少一个集合', 'warning');
        return;
    }
    
    // 获取选中的服务器 URL
    const serverUrl = elements.searchServer.value.trim();
    if (!serverUrl) {
        showStatus(elements.searchResults, '请先选择服务器', 'warning');
        return;
    }

    try {
        elements.searchBtn.disabled = true;
        elements.resultsList.innerHTML = '<div class="loading">搜索中...</div>';
        elements.searchResults.classList.remove('hidden');

        // 生成查询向量
        const model = currentSettings.embeddingModel === 'custom' 
            ? currentSettings.customModel 
            : currentSettings.embeddingModel;
        
        const queryEmbedding = await OllamaClient.generateEmbedding(
            currentSettings.ollamaUrl,
            query,
            model
        );

        // 在多个 ChromaDB 集合中搜索
        const allResults = [];
        
        for (const collectionName of selectedSearchCollections) {
            try {
                const results = await ChromaDBClient.queryDocuments(
                    serverUrl,
                    collectionName,
                    {
                        queryEmbeddings: [queryEmbedding],
                        nResults: 5
                    }
                );
                
                // 添加集合信息到结果
                if (results && results.documents && results.documents[0]) {
                    results.documents[0].forEach((doc, index) => {
                        allResults.push({
                            document: doc,
                            metadata: results.metadatas[0][index] || {},
                            distance: results.distances[0][index] || 0,
                            collection: collectionName
                        });
                    });
                }
            } catch (error) {
                console.error(`搜索集合 ${collectionName} 失败:`, error);
            }
        }
        
        // 按距离排序
        allResults.sort((a, b) => a.distance - b.distance);
        
        // 取前 10 个结果
        const topResults = allResults.slice(0, 10);

        displaySearchResults(topResults);
    } catch (error) {
        console.error('搜索失败:', error);
        elements.resultsList.innerHTML = `<div class="error">搜索失败: ${error.message}</div>`;
    } finally {
        elements.searchBtn.disabled = false;
    }
}

// 显示搜索结果
function displaySearchResults(results) {
    if (!results || results.length === 0) {
        elements.resultsList.innerHTML = '<div class="empty-state">未找到相关内容</div>';
        return;
    }

    const snippetLen = parseInt((elements.snippetLength && elements.snippetLength.value) || '300', 10) || 300;

    elements.resultsList.innerHTML = results.map((result) => {
        const distance = result.distance || 0;
        const url = result.metadata.url || '';
        const isWebUrl = url.startsWith('http://') || url.startsWith('https://');
        const urlDisplay = url || '未知 URL';

        // Build content snippet
        const content = result.document || '';
        const snippet = content.length > snippetLen
            ? content.slice(0, snippetLen).trimEnd() + '…'
            : content;

        const urlHtml = isWebUrl
            ? `<div class="result-url"><a class="result-url-link" href="#" data-url="${escapeHtml(url)}" title="${escapeHtml(url)}">${escapeHtml(urlDisplay)}</a></div>`
            : `<div class="result-url">${escapeHtml(urlDisplay)}</div>`;

        return `
            <div class="result-item">
                <div class="result-title">${escapeHtml(result.metadata.title || '无标题')}</div>
                ${urlHtml}
                <div class="result-meta-row">
                    <span class="result-collection">集合: ${escapeHtml(result.collection)}</span>
                    <span class="result-score">距离: ${distance.toFixed(4)}</span>
                </div>
                ${snippet ? `<div class="result-snippet">${escapeHtml(snippet)}</div>` : ''}
            </div>
        `;
    }).join('');

    // Open URLs via chrome.tabs.create (required in extension popup)
    elements.resultsList.querySelectorAll('.result-url-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget.dataset.url;
            if (target) chrome.tabs.create({ url: target });
        });
    });
}

// 清空所有内容
async function clearAllContent() {
    const collection = elements.manageCollectionSelect.value.trim();
    const serverUrl = elements.manageServerSelect.value.trim();
    
    if (!collection) {
        alert('请先选择一个集合');
        return;
    }
    
    if (!serverUrl) {
        alert('请先选择服务器');
        return;
    }
    
    if (!confirm(`确定要清空集合 "${collection}" 中的所有内容吗？此操作不可恢复。`)) {
        return;
    }

    try {
        // 获取集合中的所有文档
        const results = await ChromaDBClient.getDocuments(
            serverUrl,
            collection,
            { limit: 1000 }
        );
        
        if (!results || !results.ids || results.ids.length === 0) {
            alert('集合中没有内容');
            return;
        }
        
        // 从 ChromaDB 删除所有文档
        for (const id of results.ids) {
            try {
                await ChromaDBClient.deleteDocument(
                    serverUrl,
                    collection,
                    id
                );
            } catch (error) {
                console.error(`删除文档 ${id} 失败:`, error);
            }
        }
        
        // 刷新列表
        await loadContentList(collection);
        
        alert('所有内容已清空');
    } catch (error) {
        console.error('清空内容失败:', error);
        alert('清空失败: ' + error.message);
    }
}

// 生成文档 ID
function generateDocId(url) {
    return btoa(url).replace(/[/+=]/g, '');
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
window.removeChromaServer = removeChromaServer;

// ── 上传标签页相关函数 ────────────────────────────────────────────────

/**
 * 加载指定服务器的集合到上传页面的下拉框
 */
async function loadCollectionsForUploadServer(serverUrl) {
    elements.uploadCollection.innerHTML = '<option value="">加载中...</option>';
    elements.uploadCollection.disabled = true;

    if (!serverUrl) {
        elements.uploadCollection.innerHTML = '<option value="">请先选择服务器...</option>';
        elements.uploadCollection.disabled = false;
        return;
    }

    try {
        let collections = chromaCollectionsByServer[serverUrl];
        if (!collections) {
            collections = await ChromaDBClient.getCollections(serverUrl);
            chromaCollectionsByServer[serverUrl] = collections || [];
        }

        elements.uploadCollection.innerHTML = '<option value="">选择集合...</option>';
        (collections || []).forEach(col => {
            const opt = document.createElement('option');
            opt.value = col.name;
            opt.textContent = col.name;
            elements.uploadCollection.appendChild(opt);
        });
    } catch (error) {
        console.error('加载上传集合失败:', error);
        elements.uploadCollection.innerHTML = '<option value="">加载失败，请重试</option>';
    } finally {
        elements.uploadCollection.disabled = false;
    }
}

/**
 * 将大文本按字符数分块（带重叠）
 */
function splitIntoChunks(text, chunkSize = 4000, overlap = 200) {
    if (text.length <= chunkSize) return [text];
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        if (end === text.length) break;
        start = end - overlap;
    }
    return chunks;
}

/**
 * 以 UTF-8 文本方式读取 File 对象
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * 格式化文件大小显示
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 生成文件块文档 ID
 */
function generateFileChunkId(fileName, chunkIndex) {
    return btoa(encodeURIComponent(`${fileName}-chunk-${chunkIndex}`))
        .replace(/[/+=]/g, '')
        .substring(0, 50);
}

/**
 * 读取文件内容（自动判断 PDF vs 文本）
 */
async function readFileContent(file, onProgress) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
        if (!window.PdfReader) throw new Error('PDF 解析器未加载');
        return await window.PdfReader.extractText(file, onProgress);
    }
    return await readFileAsText(file);
}

// ── Drop zone 拖拽上传 ────────────────────────────────────────────────

function setupDropZone() {
    const zone = elements.dropZone;
    if (!zone) return;

    zone.addEventListener('dragenter', (e) => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragover', (e) => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.remove('drag-over');
        addFilesToQueue(e.dataTransfer.files);
    });
    zone.addEventListener('click', (e) => {
        if (!e.target.closest('.file-item-remove')) elements.fileInput.click();
    });
    elements.fileInput.addEventListener('change', (e) => {
        addFilesToQueue(e.target.files);
        elements.fileInput.value = '';
    });
}

const UPLOAD_ALLOWED_EXTS = ['.txt', '.md', '.csv', '.json', '.html', '.htm', '.pdf'];

function addFilesToQueue(newFiles) {
    Array.from(newFiles).forEach(file => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!UPLOAD_ALLOWED_EXTS.includes(ext)) {
            console.warn(`不支持的文件格式: ${file.name}`);
            return;
        }
        const isDuplicate = uploadFiles.some(f => f.name === file.name && f.size === file.size);
        if (!isDuplicate) uploadFiles.push(file);
    });
    renderFileList();
}

function renderFileList() {
    if (uploadFiles.length === 0) {
        elements.fileList.innerHTML = '';
        elements.fileList.classList.add('hidden');
        return;
    }
    elements.fileList.classList.remove('hidden');
    elements.fileList.innerHTML = uploadFiles.map((file, idx) => {
        const ext = file.name.split('.').pop().toLowerCase();
        const icon = ext === 'pdf' ? '📕' : '📄';
        return `
            <div class="file-list-item">
                <span class="file-item-icon">${icon}</span>
                <span class="file-item-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                <span class="file-item-size">${formatFileSize(file.size)}</span>
                <button class="file-item-remove" data-idx="${idx}" title="移除">✕</button>
            </div>
        `;
    }).join('');
    elements.fileList.querySelectorAll('.file-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            uploadFiles.splice(parseInt(btn.dataset.idx), 1);
            renderFileList();
        });
    });
}

/**
 * 上传并嵌入文件（支持多文件和 PDF）
 */
async function uploadFile() {
    if (uploadFiles.length === 0) {
        showStatus(elements.uploadStatus, '请先选择要上传的文件', 'warning');
        return;
    }

    const serverUrl = elements.uploadServer.value.trim();
    if (!serverUrl) { showStatus(elements.uploadStatus, '请先选择服务器', 'warning'); return; }

    const collectionName = elements.uploadCollection.value.trim();
    if (!collectionName) { showStatus(elements.uploadStatus, '请先选择集合', 'warning'); return; }

    const model = currentSettings.embeddingModel === 'custom'
        ? currentSettings.customModel
        : currentSettings.embeddingModel;

    elements.uploadBtn.disabled = true;
    let totalSaved = 0;
    const failedFiles = [];

    try {
        for (let fileIdx = 0; fileIdx < uploadFiles.length; fileIdx++) {
            const file = uploadFiles[fileIdx];
            const isPdf = file.name.split('.').pop().toLowerCase() === 'pdf';

            try {
                showProgress(elements.uploadStatus,
                    `(文件 ${fileIdx + 1}/${uploadFiles.length}) 读取: ${file.name}`);
                updateProgress(elements.uploadStatus,
                    Math.round((fileIdx / uploadFiles.length) * 10));

                let content;
                if (isPdf) {
                    content = await readFileContent(file, (pageNum, total) => {
                        showProgress(elements.uploadStatus,
                            `(文件 ${fileIdx + 1}/${uploadFiles.length}) 解析 PDF: 第 ${pageNum}/${total} 页`);
                    });
                } else {
                    content = await readFileContent(file);
                }

                if (!content || content.trim().length === 0) {
                    failedFiles.push(`${file.name} (内容为空)`);
                    continue;
                }

                const chunks = splitIntoChunks(content, 4000, 200);

                // Duplicate check
                showProgress(elements.uploadStatus,
                    `(文件 ${fileIdx + 1}/${uploadFiles.length}) 检查重复: ${file.name}`);
                const firstChunkId = generateFileChunkId(file.name, 0);
                const exists = await ChromaDBClient.checkDocumentExists(serverUrl, collectionName, firstChunkId);

                let useUpsert = false;
                if (exists) {
                    useUpsert = confirm(
                        `文件 "${file.name}" 已存在于集合 "${collectionName}" 中。\n\n点击"确定"更新已有内容，点击"取消"跳过该文件。`
                    );
                    if (!useUpsert) continue;
                }

                // Embed & save each chunk
                for (let i = 0; i < chunks.length; i++) {
                    const overallPct = Math.round(
                        ((fileIdx + (i + 1) / chunks.length) / uploadFiles.length) * 85 + 10
                    );
                    showProgress(elements.uploadStatus,
                        chunks.length > 1
                            ? `(文件 ${fileIdx + 1}/${uploadFiles.length}) ${file.name}: 嵌入第 ${i + 1}/${chunks.length} 块`
                            : `(文件 ${fileIdx + 1}/${uploadFiles.length}) 生成嵌入: ${file.name}`
                    );
                    updateProgress(elements.uploadStatus, overallPct);

                    const chunkId = generateFileChunkId(file.name, i);
                    const embedding = await OllamaClient.generateEmbedding(
                        currentSettings.ollamaUrl, chunks[i], model
                    );
                    const doc = {
                        id: chunkId,
                        content: chunks[i],
                        metadata: {
                            source: file.name,
                            url: `file://${file.name}`,
                            title: file.name,
                            chunk: i,
                            totalChunks: chunks.length,
                            fileType: isPdf ? 'pdf' : 'text',
                            timestamp: new Date().toISOString(),
                            type: 'file'
                        },
                        embedding
                    };
                    if (useUpsert) {
                        await ChromaDBClient.upsertDocument(serverUrl, collectionName, doc);
                    } else {
                        await ChromaDBClient.addDocument(serverUrl, collectionName, doc);
                    }
                    totalSaved++;
                }
            } catch (fileErr) {
                console.error(`处理文件 ${file.name} 失败:`, fileErr);
                failedFiles.push(`${file.name} (${fileErr.message})`);
            }
        }

        updateProgress(elements.uploadStatus, 100);
        hideProgress(elements.uploadStatus);

        if (failedFiles.length === 0) {
            showStatus(elements.uploadStatus,
                `全部完成！共保存 ${totalSaved} 条内容（${uploadFiles.length} 个文件）`, 'success');
        } else {
            showStatus(elements.uploadStatus,
                `完成！已保存 ${totalSaved} 条。失败: ${failedFiles.join('; ')}`, 'warning');
        }

        // Reset queue
        uploadFiles = [];
        elements.fileInput.value = '';
        renderFileList();
    } catch (error) {
        console.error('上传失败:', error);
        hideProgress(elements.uploadStatus);
        showStatus(elements.uploadStatus, `上传失败: ${error.message}`, 'error');
    } finally {
        elements.uploadBtn.disabled = false;
    }
}

// ── 删除重复文档 ──────────────────────────────────────────────────────

/**
 * 检测并删除选中集合中的重复文档
 */
async function removeDuplicates() {
    const collectionName = elements.manageCollectionSelect.value.trim();
    const serverUrl = elements.manageServerSelect.value.trim();

    if (!collectionName) {
        alert('请先选择一个集合');
        return;
    }
    if (!serverUrl) {
        alert('请先选择服务器');
        return;
    }

    try {
        elements.removeDuplicatesBtn.disabled = true;
        elements.removeDuplicatesBtn.innerHTML = '<span class="btn-icon">⏳</span>检测中...';

        const { urlGroups, totalDuplicates } = await ChromaDBClient.findDuplicates(serverUrl, collectionName);

        if (totalDuplicates === 0) {
            alert('未发现重复内容，集合数据已是最优状态。');
            return;
        }

        const confirmed = confirm(
            `发现 ${totalDuplicates} 条重复内容（来自 ${urlGroups.size} 个重复来源）。\n` +
            `将对每个来源保留最新版本，删除旧版本。\n\n是否继续？`
        );
        if (!confirmed) return;

        let deletedCount = 0;
        for (const [, docs] of urlGroups.entries()) {
            if (docs.length <= 1) continue;

            // Sort newest first by timestamp
            docs.sort((a, b) => {
                const tA = a.metadata.timestamp ? new Date(a.metadata.timestamp).getTime() : 0;
                const tB = b.metadata.timestamp ? new Date(b.metadata.timestamp).getTime() : 0;
                return tB - tA;
            });

            // Delete all but the first (newest)
            for (let i = 1; i < docs.length; i++) {
                await ChromaDBClient.deleteDocument(serverUrl, collectionName, docs[i].id);
                deletedCount++;
            }
        }

        await loadContentList(collectionName);
        alert(`已成功删除 ${deletedCount} 条重复内容。`);
    } catch (error) {
        console.error('删除重复内容失败:', error);
        alert(`操作失败: ${error.message}`);
    } finally {
        elements.removeDuplicatesBtn.disabled = false;
        elements.removeDuplicatesBtn.innerHTML = '<span class="btn-icon">🔍</span>删除重复';
    }
}

// 初始化多选下拉框
function initMultiSelectDropdowns() {
    updateMultiSelectDropdown('capture', chromaCollections);
    updateMultiSelectDropdown('search', chromaCollections);
    
    // 默认选择所有集合用于搜索
    if (chromaCollections.length > 0) {
        selectedSearchCollections = chromaCollections.map(c => c.name);
        updateMultiSelectDisplay('search');
    }
}

// 更新多选下拉框内容
function updateMultiSelectDropdown(type, collections) {
    const dropdown = type === 'capture' ? elements.captureCollectionDropdown : elements.searchCollectionDropdown;
    const display = type === 'capture' ? elements.captureCollectionDisplay : elements.searchCollectionDisplay;
    const container = display.parentElement;

    if (!collections || collections.length === 0) {
        dropdown.innerHTML = '<div class="empty-state">暂无可用集合</div>';
        return;
    }

    // 获取当前集合的名称列表
    const collectionNames = collections.map(c => c.name);

    // 过滤掉不在当前集合列表中的选项
    const selected = type === 'capture' ? selectedCaptureCollections : selectedSearchCollections;
    const validSelected = selected.filter(name => collectionNames.includes(name));

    // 更新选择列表（移除无效选项）
    if (validSelected.length !== selected.length) {
        if (type === 'capture') {
            selectedCaptureCollections = validSelected;
        } else {
            selectedSearchCollections = validSelected;
        }
        saveSelectedCollections();
    }

    dropdown.innerHTML = `
        <div class="multi-select-option">
            <input type="checkbox" id="${type}-select-all" ${validSelected.length === collections.length ? 'checked' : ''}>
            <label for="${type}-select-all">全选</label>
        </div>
        ${collections.map(collection => `
            <div class="multi-select-option">
                <input type="checkbox"
                       id="${type}-${collection.name}"
                       value="${collection.name}"
                       ${validSelected.includes(collection.name) ? 'checked' : ''}>
                <label for="${type}-${collection.name}">
                    <strong>${escapeHtml(collection.name)}</strong>
                </label>
            </div>
        `).join('')}
    `;

    // 添加事件监听器
    const selectAllCheckbox = dropdown.querySelector(`#${type}-select-all`);
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = dropdown.querySelectorAll(`input[type="checkbox"]:not(#${type}-select-all)`);
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        updateSelectedCollections(type, collections);
    });

    const checkboxes = dropdown.querySelectorAll(`input[type="checkbox"]:not(#${type}-select-all)`);
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateSelectedCollections(type, collections);
            // 更新全选状态
            const allChecked = Array.from(checkboxes).every(c => c.checked);
            selectAllCheckbox.checked = allChecked;
        });
    });

    // 更新显示文本
    updateMultiSelectDisplay(type);
}

// 切换下拉框显示
function toggleMultiSelectDropdown(type) {
    const dropdown = type === 'capture' ? elements.captureCollectionDropdown : elements.searchCollectionDropdown;
    const display = type === 'capture' ? elements.captureCollectionDisplay : elements.searchCollectionDisplay;
    const container = display.parentElement;
    
    // 关闭其他下拉框
    if (type === 'capture') {
        elements.searchCollectionDropdown.classList.remove('show');
        elements.searchCollectionDisplay.parentElement.classList.remove('open');
    } else {
        elements.captureCollectionDropdown.classList.remove('show');
        elements.captureCollectionDisplay.parentElement.classList.remove('open');
    }
    
    dropdown.classList.toggle('show');
    container.classList.toggle('open');
}

// 更新选中的集合
function updateSelectedCollections(type, collections) {
    const dropdown = type === 'capture' ? elements.captureCollectionDropdown : elements.searchCollectionDropdown;
    const checkboxes = dropdown.querySelectorAll(`input[type="checkbox"]:not(#${type}-select-all)`);
    
    const selected = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    if (type === 'capture') {
        selectedCaptureCollections = selected;
    } else {
        selectedSearchCollections = selected;
    }
    
    // 更新显示
    updateMultiSelectDisplay(type);
    
    // 保存到存储
    saveSelectedCollections();
}

// 保存选中的集合到存储
async function saveSelectedCollections() {
    try {
        // 获取当前服务器的选择
        const captureServerUrl = elements.captureServer.value;
        const searchServerUrl = elements.searchServer.value;

        // 更新按服务器分组的选择
        if (captureServerUrl) {
            selectedCaptureCollectionsByServer[captureServerUrl] = [...selectedCaptureCollections];
        }
        if (searchServerUrl) {
            selectedSearchCollectionsByServer[searchServerUrl] = [...selectedSearchCollections];
        }

        await chrome.storage.local.set({
            selectedCaptureCollectionsByServer,
            selectedSearchCollectionsByServer
        });
    } catch (error) {
        console.error('保存选中集合失败:', error);
    }
}

// 从存储加载选中的集合
async function loadSelectedCollections() {
    try {
        const data = await chrome.storage.local.get(['selectedCaptureCollectionsByServer', 'selectedSearchCollectionsByServer']);
        if (data.selectedCaptureCollectionsByServer) {
            selectedCaptureCollectionsByServer = data.selectedCaptureCollectionsByServer;
        }
        if (data.selectedSearchCollectionsByServer) {
            selectedSearchCollectionsByServer = data.selectedSearchCollectionsByServer;
        }
    } catch (error) {
        console.error('加载选中集合失败:', error);
    }
}

// 更新多选显示文本
function updateMultiSelectDisplay(type) {
    const textElement = type === 'capture' ? elements.captureCollectionText : elements.searchCollectionText;
    const countElement = type === 'capture' ? elements.captureCollectionCount : elements.searchCollectionCount;
    const selected = type === 'capture' ? selectedCaptureCollections : selectedSearchCollections;

    // 获取当前服务器的集合列表
    const serverUrl = type === 'capture' ? elements.captureServer.value : elements.searchServer.value;
    const currentCollections = serverUrl && chromaCollectionsByServer[serverUrl]
        ? chromaCollectionsByServer[serverUrl].map(c => c.name)
        : [];

    // 过滤掉不在当前服务器集合列表中的选项
    const validSelected = selected.filter(name => currentCollections.includes(name));

    // 如果有无效的选择，更新选择列表
    if (validSelected.length !== selected.length) {
        if (type === 'capture') {
            selectedCaptureCollections = validSelected;
        } else {
            selectedSearchCollections = validSelected;
        }
        saveSelectedCollections();
    }

    if (validSelected.length === 0) {
        textElement.textContent = '选择集合...';
        countElement.textContent = '';
    } else if (validSelected.length === 1) {
        textElement.textContent = validSelected[0];
        countElement.textContent = '';
    } else {
        textElement.textContent = `已选择 ${validSelected.length} 个集合`;
        countElement.textContent = '';
    }
}