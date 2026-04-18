// 内容脚本 - 在网页上下文中运行
// 用于提取页面内容

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        try {
            const content = extractPageContent();
            sendResponse({
                success: true,
                content: content
            });
        } catch (error) {
            console.error('提取内容失败:', error);
            sendResponse({
                success: false,
                error: error
            });
        }
        return true; // 保持消息通道开放以支持异步响应
    } else if (request.action === 'getSelection') {
        try {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText) {
                sendResponse({
                    success: true,
                    content: selectedText
                });
            } else {
                sendResponse({
                    success: false,
                    error: new Error('没有选择内容')
                });
            }
        } catch (error) {
            console.error('获取选择内容失败:', error);
            sendResponse({
                success: false,
                error: error
            });
        }
        return true;
    }
});

/**
 * 提取页面内容
 * @returns {string} 页面的 HTML 内容
 */
function extractPageContent() {
    // 获取页面的完整 HTML
    let html = document.documentElement.outerHTML;
    
    // 如果页面是动态加载的，尝试等待内容加载
    if (document.body && document.body.innerHTML.trim() === '') {
        // 页面可能是动态加载的，等待一小段时间
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(document.documentElement.outerHTML);
            }, 500);
        });
    }
    
    return html;
}

/**
 * 提取页面的主要文本内容（去除脚本、样式等）
 * @returns {string} 页面的纯文本内容
 */
function extractMainContent() {
    // 创建一个临时容器
    const tempDiv = document.createElement('div');
    
    // 克隆文档内容
    tempDiv.innerHTML = document.documentElement.outerHTML;
    
    // 移除不需要的元素
    const elementsToRemove = tempDiv.querySelectorAll(
        'script, style, noscript, iframe, svg, [style*="display: none"], [style*="display:none"]'
    );
    elementsToRemove.forEach(el => el.remove());
    
    // 提取文本
    return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * 提取页面的元数据
 * @returns {Object} 页面元数据
 */
function extractPageMetadata() {
    const metadata = {
        title: document.title || '',
        url: window.location.href,
        description: '',
        keywords: '',
        author: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: ''
    };
    
    // 提取 meta 标签
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(tag => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const content = tag.getAttribute('content');
        
        if (name && content) {
            if (name === 'description') metadata.description = content;
            else if (name === 'keywords') metadata.keywords = content;
            else if (name === 'author') metadata.author = content;
            else if (name === 'og:title') metadata.ogTitle = content;
            else if (name === 'og:description') metadata.ogDescription = content;
            else if (name === 'og:image') metadata.ogImage = content;
        }
    });
    
    return metadata;
}

/**
 * 提取页面的主要内容区域
 * 尝试识别页面的主要内容部分（如 article, main 等）
 * @returns {string} 主要内容区域的 HTML
 */
function extractMainSection() {
    // 尝试查找主要内容区域
    const mainSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.main-content',
        '.article-content',
        '#content',
        '#main'
    ];
    
    for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element.outerHTML;
        }
    }
    
    // 如果没有找到主要内容区域，返回 body
    return document.body ? document.body.outerHTML : '';
}

// 页面加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Content script loaded');
    });
} else {
    console.log('Content script loaded');
}