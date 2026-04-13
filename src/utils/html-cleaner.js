/**
 * HTML 清理工具
 * 用于提取和清理网页内容
 */

console.log('html-cleaner.js 已加载');

const HtmlCleaner = {
    /**
     * 清理 HTML 内容，提取纯文本
     * @param {string} html - 原始 HTML 内容
     * @returns {string} 清理后的文本内容
     */
    cleanHtml(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // 创建一个临时的 DOM 解析器
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 移除不需要的元素
        this.removeUnwantedElements(doc);

        // 提取文本内容
        let text = doc.body.textContent || doc.body.innerText || '';

        // 清理文本
        text = this.cleanText(text);

        return text;
    },

    /**
     * 移除不需要的 HTML 元素
     * @param {Document} doc - DOM 文档对象
     */
    removeUnwantedElements(doc) {
        const selectors = [
            'script',
            'style',
            'noscript',
            'iframe',
            'svg',
            'canvas',
            'video',
            'audio',
            'object',
            'embed',
            'applet',
            'form',
            'input',
            'textarea',
            'select',
            'button',
            'nav',
            'footer',
            'header',
            'aside',
            '[style*="display: none"]',
            '[style*="display:none"]',
            '.hidden',
            '.ad',
            '.advertisement',
            '.ads',
            '.sidebar',
            '.comments',
            '.comment-section',
            '.social-share',
            '.cookie-banner',
            '.popup',
            '.modal'
        ];

        selectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
    },

    /**
     * 清理文本内容
     * @param {string} text - 原始文本
     * @returns {string} 清理后的文本
     */
    cleanText(text) {
        if (!text) return '';

        // 移除多余的空白字符
        text = text.replace(/\s+/g, ' ');
        
        // 移除首尾空白
        text = text.trim();
        
        // 移除特殊字符（保留基本的标点符号）
        text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        
        // 移除连续的换行符
        text = text.replace(/\n\s*\n/g, '\n\n');
        
        // 限制文本长度（可选，根据需要调整）
        const maxLength = 100000; // 100k 字符
        if (text.length > maxLength) {
            text = text.substring(0, maxLength) + '...';
        }

        return text;
    },

    /**
     * 提取页面的主要内容
     * @param {string} html - 原始 HTML 内容
     * @returns {string} 主要内容的文本
     */
    extractMainContent(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 尝试查找主要内容区域
        const mainSelectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.main-content',
            '.article-content',
            '.post-content',
            '#content',
            '#main',
            '#article',
            '#post'
        ];

        let mainElement = null;
        for (const selector of mainSelectors) {
            mainElement = doc.querySelector(selector);
            if (mainElement) break;
        }

        // 如果找到主要内容区域，只清理该区域
        if (mainElement) {
            const tempDoc = document.implementation.createHTMLDocument('');
            tempDoc.body.appendChild(mainElement.cloneNode(true));
            this.removeUnwantedElements(tempDoc);
            let text = tempDoc.body.textContent || tempDoc.body.innerText || '';
            return this.cleanText(text);
        }

        // 如果没有找到主要内容区域，清理整个文档
        return this.cleanHtml(html);
    },

    /**
     * 提取页面的标题
     * @param {string} html - 原始 HTML 内容
     * @returns {string} 页面标题
     */
    extractTitle(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        return doc.title || '';
    },

    /**
     * 提取页面的元数据
     * @param {string} html - 原始 HTML 内容
     * @returns {Object} 元数据对象
     */
    extractMetadata(html) {
        if (!html || typeof html !== 'string') {
            return {};
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const metadata = {
            title: doc.title || '',
            description: '',
            keywords: '',
            author: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: ''
        };

        const metaTags = doc.querySelectorAll('meta');
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
    },

    /**
     * 提取页面的链接
     * @param {string} html - 原始 HTML 内容
     * @returns {Array} 链接数组
     */
    extractLinks(html) {
        if (!html || typeof html !== 'string') {
            return [];
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const links = [];
        const anchorTags = doc.querySelectorAll('a[href]');

        anchorTags.forEach(anchor => {
            links.push({
                href: anchor.getAttribute('href'),
                text: anchor.textContent.trim(),
                title: anchor.getAttribute('title') || ''
            });
        });

        return links;
    },

    /**
     * 提取页面的图片
     * @param {string} html - 原始 HTML 内容
     * @returns {Array} 图片数组
     */
    extractImages(html) {
        if (!html || typeof html !== 'string') {
            return [];
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const images = [];
        const imgTags = doc.querySelectorAll('img[src]');

        imgTags.forEach(img => {
            images.push({
                src: img.getAttribute('src'),
                alt: img.getAttribute('alt') || '',
                title: img.getAttribute('title') || ''
            });
        });

        return images;
    }
};

// 如果在浏览器环境中，将 HtmlCleaner 添加到全局作用域
if (typeof window !== 'undefined') {
    window.HtmlCleaner = HtmlCleaner;
}

// 如果在 Service Worker 或其他环境中，导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HtmlCleaner;
}