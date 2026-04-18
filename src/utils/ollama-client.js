/**
 * Ollama API 客户端
 * 用于与 Ollama 服务进行交互，生成文本嵌入向量
 */

console.log('ollama-client.js 已加载');

const OllamaClient = {
    /**
     * 生成文本嵌入向量
     * @param {string} baseUrl - Ollama 服务器基础 URL
     * @param {string} text - 要向量化的文本
     * @param {string} model - 使用的嵌入模型
     * @returns {Promise<Array>} 嵌入向量数组
     */
    async generateEmbedding(baseUrl, text, model = 'nomic-embed-text') {
        if (!baseUrl) {
            throw new Error('Ollama 服务器地址未配置');
        }

        if (!text || typeof text !== 'string') {
            throw new Error('文本内容无效');
        }

        if (!model) {
            throw new Error('嵌入模型未指定');
        }

        console.log(`=== 开始生成嵌入向量 ===`);
        console.log(`Base URL: ${baseUrl}`);
        console.log(`Model: ${model}`);
        console.log(`Text length: ${text.length} characters`);
        console.log(`Text preview: ${text.substring(0, 100)}...`);

        // 尝试不同的模型名称格式
        const modelVariants = [
            model,                           // 原始名称
            model.includes(':') ? model.split(':')[0] : model,  // 去掉版本号
            !model.includes(':') ? `${model}:latest` : model, // 添加版本号
        ];

        // 确保 URL 以 / 结尾
        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const endpoint = `${url}api/embeddings`;

        console.log(`Endpoint: ${endpoint}`);
        console.log(`Will try ${modelVariants.length} model variants:`, modelVariants);

        let lastError = null;
        
        for (let i = 0; i < modelVariants.length; i++) {
            const currentModel = modelVariants[i];
            console.log(`尝试 ${i + 1}/${modelVariants.length}: "${currentModel}"`);

            try {
                const requestBody = {
                    model: currentModel,
                    prompt: text
                };
                
                console.log(`请求体:`, JSON.stringify(requestBody, null, 2));
                console.log(`请求体大小:`, JSON.stringify(requestBody).length, "bytes");
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                console.log(`Response status: ${response.status}`);
                console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`模型 "${currentModel}" 失败:`, response.status, errorText);
                    console.error(`错误详情:`, errorText);
                    lastError = { status: response.status, text: errorText, model: currentModel };
                    continue; // 尝试下一个变体
                }

                const data = await response.json();
                console.log(`成功！模型: ${currentModel}`);
                console.log(`Embedding dimensions: ${data.embedding?.length || 0}`);

                if (!data.embedding || !Array.isArray(data.embedding)) {
                    throw new Error('Ollama API 返回的数据格式无效');
                }

                return data.embedding;
            } catch (error) {
                console.error(`模型 "${currentModel}" 异常:`, error.message);
                lastError = error;
                continue;
            }
        }

        // 所有变体都失败了
        console.error('所有模型变体都失败了');
        console.error('最后错误:', lastError);
        
        if (lastError && lastError.status === 403) {
            const modelList = modelVariants.map(m => `"${m}"`).join(', ');
            throw new Error(
                `模型 "${model}" 无法使用。已尝试: ${modelList}。\n` +
                `请确认:\n` +
                `1. 模型已安装: 运行 'ollama list' 查看\n` +
                `2. 模型支持嵌入功能: 运行 'ollama show ${model}' 检查\n` +
                `3. Ollama 服务正在运行: 运行 'ollama serve'\n` +
                `4. 模型名称正确: 检查大小写和拼写`
            );
        } else if (lastError && lastError.status === 404) {
            throw new Error(`Ollama API 端点未找到，请检查服务器地址: ${url}`);
        } else {
            throw new Error(`生成嵌入向量失败: ${lastError?.message || '未知错误'}`);
        }
    },

    /**
     * 批量生成嵌入向量
     * @param {string} baseUrl - Ollama 服务器基础 URL
     * @param {Array<string>} texts - 要向量化的文本数组
     * @param {string} model - 使用的嵌入模型
     * @returns {Promise<Array<Array>>} 嵌入向量数组
     */
    async generateBatchEmbeddings(baseUrl, texts, model = 'nomic-embed-text') {
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('文本数组无效');
        }

        const embeddings = [];
        
        for (let i = 0; i < texts.length; i++) {
            try {
                const embedding = await this.generateEmbedding(baseUrl, texts[i], model);
                embeddings.push(embedding);
                
                // 添加延迟以避免过载
                if (i < texts.length - 1) {
                    await this.sleep(100);
                }
            } catch (error) {
                console.error(`生成第 ${i + 1} 个嵌入向量失败:`, error);
                throw error;
            }
        }

        return embeddings;
    },

    /**
     * 测试 Ollama 连接
     * @param {string} baseUrl - Ollama 服务器基础 URL
     * @returns {Promise<Object>} 连接状态
     */
    async testConnection(baseUrl) {
        if (!baseUrl) {
            throw new Error('Ollama 服务器地址未配置');
        }

        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const endpoint = `${url}api/tags`;

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                message: '连接成功',
                models: data.models || []
            };
        } catch (error) {
            console.error('测试连接失败:', error);
            throw new Error(`连接失败: ${error.message}`);
        }
    },

    /**
     * 获取可用的模型列表
     * @param {string} baseUrl - Ollama 服务器基础 URL
     * @returns {Promise<Array>} 模型列表
     */
    async getModels(baseUrl) {
        if (!baseUrl) {
            throw new Error('Ollama 服务器地址未配置');
        }

        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const endpoint = `${url}api/tags`;

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            return data.models || [];
        } catch (error) {
            console.error('获取模型列表失败:', error);
            throw new Error(`获取模型列表失败: ${error.message}`);
        }
    },

    /**
     * 检查模型是否存在
     * @param {string} baseUrl - Ollama 服务器基础 URL
     * @param {string} model - 模型名称
     * @returns {Promise<boolean>} 模型是否存在
     */
    async modelExists(baseUrl, model) {
        try {
            const models = await this.getModels(baseUrl);
            return models.some(m => m.name === model || m.name.startsWith(model + ':'));
        } catch (error) {
            console.error('检查模型存在性失败:', error);
            return false;
        }
    },

    /**
     * 睡眠函数
     * @param {number} ms - 毫秒数
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 重试机制
     * @param {Function} fn - 要执行的函数
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试延迟（毫秒）
     * @returns {Promise<any>} 函数执行结果
     */
    async retry(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw error;
                }
                console.log(`重试 ${i + 1}/${maxRetries}...`);
                await this.sleep(delay);
            }
        }
    }
};

// 如果在浏览器环境中，将 OllamaClient 添加到全局作用域
if (typeof window !== 'undefined') {
    window.OllamaClient = OllamaClient;
}

// 如果在 Service Worker 或其他环境中，导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OllamaClient;
}