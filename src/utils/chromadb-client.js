/**
 * ChromaDB API 客户端
 * 用于与 ChromaDB 向量数据库进行交互
 */

console.log('chromadb-client.js 已加载');

const ChromaDBClient = {
    // 缓存集合名称到 UUID 的映射
    collectionCache: new Map(),

    /**
     * 获取或创建集合 ID
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @returns {Promise<string>} 集合 UUID
     */
    async getOrCreateCollectionId(baseUrl, collectionName) {
        // 检查缓存
        if (this.collectionCache.has(collectionName)) {
            return this.collectionCache.get(collectionName);
        }

        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

        // 先尝试获取集合列表
        try {
            const listEndpoint = `${url}api/v2/tenants/default/databases/default/collections`;
            const response = await fetch(listEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const existing = data.find(c => c.name === collectionName);
                if (existing) {
                    this.collectionCache.set(collectionName, existing.id);
                    return existing.id;
                }
            }
        } catch (error) {
            console.log('获取集合列表失败，尝试创建:', error.message);
        }

        // 创建新集合
        const createEndpoint = `${url}api/v2/tenants/default/databases/default/collections`;
        const response = await fetch(createEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: collectionName,
                metadata: {
                    description: 'Webpage content collection'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            // 如果集合已存在，再次尝试获取
            if (response.status === 409 || errorText.includes('already exists')) {
                console.log(`集合 ${collectionName} 已存在，重新获取`);
                return this.getOrCreateCollectionId(baseUrl, collectionName);
            }
            throw new Error(`ChromaDB API 错误 (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        this.collectionCache.set(collectionName, data.id);
        return data.id;
    },

    /**
     * 创建集合
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @returns {Promise<Object>} 集合信息
     */
    async createCollection(baseUrl, collectionName) {
        if (!baseUrl) {
            throw new Error('ChromaDB 服务器地址未配置');
        }

        if (!collectionName) {
            throw new Error('集合名称未指定');
        }

        const collectionId = await this.getOrCreateCollectionId(baseUrl, collectionName);
        return { id: collectionId, name: collectionName };
    },

    /**
     * 添加文档到集合
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @param {Object} document - 文档对象 { id, content, metadata, embedding }
     * @returns {Promise<string>} 文档 ID
     */
    async addDocument(baseUrl, collectionName, document) {
        if (!baseUrl) {
            throw new Error('ChromaDB 服务器地址未配置');
        }

        if (!collectionName) {
            throw new Error('集合名称未指定');
        }

        if (!document || !document.id || !document.content || !document.embedding) {
            throw new Error('文档数据无效');
        }

        try {
            // 首先获取集合的 UUID
            const collectionId = await this.getCollectionId(baseUrl, collectionName);
            
            if (!collectionId) {
                throw new Error(`集合 ${collectionName} 不存在`);
            }

            const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            // 使用 v2 API - 使用集合 UUID
            const endpoint = `${url}api/v2/tenants/default/databases/default/collections/${collectionId}/add`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ids: [document.id],
                    documents: [document.content],
                    metadatas: [document.metadata],
                    embeddings: [document.embedding]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ChromaDB API 错误 (${response.status}): ${errorText}`);
            }

            return document.id;
        } catch (error) {
            console.error('添加文档失败:', error);
            throw new Error(`添加文档失败: ${error.message}`);
        }
    },

    /**
     * 批量添加文档
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @param {Array<Object>} documents - 文档数组
     * @returns {Promise<Array<string>>} 文档 ID 数组
     */
    async addDocuments(baseUrl, collectionName, documents) {
        if (!Array.isArray(documents) || documents.length === 0) {
            throw new Error('文档数组无效');
        }

        try {
            // 首先获取集合的 UUID
            const collectionId = await this.getCollectionId(baseUrl, collectionName);
            
            if (!collectionId) {
                throw new Error(`集合 ${collectionName} 不存在`);
            }

            const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            // 使用 v2 API - 使用集合 UUID
            const endpoint = `${url}api/v2/tenants/default/databases/default/collections/${collectionId}/add`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ids: documents.map(d => d.id),
                    documents: documents.map(d => d.content),
                    metadatas: documents.map(d => d.metadata),
                    embeddings: documents.map(d => d.embedding)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ChromaDB API 错误 (${response.status}): ${errorText}`);
            }

            return documents.map(d => d.id);
        } catch (error) {
            console.error('批量添加文档失败:', error);
            throw new Error(`批量添加文档失败: ${error.message}`);
        }
    },

    /**
     * 查询相似文档
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @param {Object} query - 查询参数 { queryEmbeddings, nResults, where }
     * @returns {Promise<Object>} 查询结果
     */
    async queryDocuments(baseUrl, collectionName, query) {
        if (!baseUrl) {
            throw new Error('ChromaDB 服务器地址未配置');
        }

        if (!collectionName) {
            throw new Error('集合名称未指定');
        }

        if (!query || !query.queryEmbeddings) {
            throw new Error('查询参数无效');
        }

        try {
            // 首先获取集合的 UUID
            const collectionId = await this.getCollectionId(baseUrl, collectionName);
            
            if (!collectionId) {
                throw new Error(`集合 ${collectionName} 不存在`);
            }

            const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            // 使用 v2 API - 使用集合 UUID
            const endpoint = `${url}api/v2/tenants/default/databases/default/collections/${collectionId}/query`;

            const requestBody = {
                query_embeddings: query.queryEmbeddings,
                n_results: query.nResults || 5
            };

            if (query.where) {
                requestBody.where = query.where;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ChromaDB API 错误 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('查询文档失败:', error);
            throw new Error(`查询文档失败: ${error.message}`);
        }
    },

    /**
     * 获取集合中的所有文档
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @param {Object} options - 选项 { limit, offset, where }
     * @returns {Promise<Object>} 文档列表
     */
    async getDocuments(baseUrl, collectionName, options = {}) {
        if (!baseUrl) {
            throw new Error('ChromaDB 服务器地址未配置');
        }

        if (!collectionName) {
            throw new Error('集合名称未指定');
        }

        try {
            // 首先获取集合的 UUID
            const collectionId = await this.getCollectionId(baseUrl, collectionName);
            
            if (!collectionId) {
                throw new Error(`集合 ${collectionName} 不存在`);
            }

            const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            // 使用 v2 API - 使用集合 UUID
            const endpoint = `${url}api/v2/tenants/default/databases/default/collections/${collectionId}/get`;

            const requestBody = {};
            
            if (options.limit) {
                requestBody.limit = options.limit;
            }
            
            if (options.offset) {
                requestBody.offset = options.offset;
            }
            
            if (options.where) {
                requestBody.where = options.where;
            }

            // 如果没有指定任何选项，至少添加一个空对象
            if (Object.keys(requestBody).length === 0) {
                requestBody.limit = 1000; // 默认限制
            }

            console.log(`获取文档 - 端点: ${endpoint}, 请求体:`, JSON.stringify(requestBody, null, 2));

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`获取文档失败 - 状态码: ${response.status}, 错误:`, errorText);
                throw new Error(`ChromaDB API 错误 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            console.log(`获取文档成功 - 返回数据:`, JSON.stringify(data, null, 2));
            return data;
        } catch (error) {
            console.error('获取文档失败:', error);
            throw new Error(`获取文档失败: ${error.message}`);
        }
    },

    /**
     * 删除文档
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @param {string} docId - 文档 ID
     * @returns {Promise<void>}
     */
    async deleteDocument(baseUrl, collectionName, docId) {
        if (!baseUrl) {
            throw new Error('ChromaDB 服务器地址未配置');
        }

        if (!collectionName) {
            throw new Error('集合名称未指定');
        }

        if (!docId) {
            throw new Error('文档 ID 未指定');
        }

        try {
            // 首先获取集合的 UUID
            const collectionId = await this.getCollectionId(baseUrl, collectionName);
            
            if (!collectionId) {
                throw new Error(`集合 ${collectionName} 不存在`);
            }

            const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            // 使用 v2 API - 使用集合 UUID
            const endpoint = `${url}api/v2/tenants/default/databases/default/collections/${collectionId}/delete`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ids: [docId]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ChromaDB API 错误 (${response.status}): ${errorText}`);
            }
        } catch (error) {
            console.error('删除文档失败:', error);
            throw new Error(`删除文档失败: ${error.message}`);
        }
    },

    /**
     * 删除集合
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @returns {Promise<void>}
     */
    async deleteCollection(baseUrl, collectionName) {
        if (!baseUrl) {
            throw new Error('ChromaDB 服务器地址未配置');
        }

        if (!collectionName) {
            throw new Error('集合名称未指定');
        }

        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        // 使用 v2 API（可以直接使用集合名称）
        const endpoint = `${url}api/v2/tenants/default/databases/default/collections/${collectionName}`;

        try {
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ChromaDB API 错误 (${response.status}): ${errorText}`);
            }

            // 从缓存中移除
            this.collectionCache.delete(collectionName);
        } catch (error) {
            console.error('删除集合失败:', error);
            throw new Error(`删除集合失败: ${error.message}`);
        }
    },

    /**
     * 获取集合 ID（不创建）
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @param {string} collectionName - 集合名称
     * @returns {Promise<string|null>} 集合 UUID，如果不存在返回 null
     */
    async getCollectionId(baseUrl, collectionName) {
        // 检查缓存
        if (this.collectionCache.has(collectionName)) {
            return this.collectionCache.get(collectionName);
        }

        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

        // 获取集合列表
        try {
            const endpoint = `${url}api/v2/tenants/default/databases/default/collections`;
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const existing = data.find(c => c.name === collectionName);
                if (existing) {
                    this.collectionCache.set(collectionName, existing.id);
                    return existing.id;
                }
            }
        } catch (error) {
            console.log('获取集合列表失败:', error.message);
        }

        return null;
    },

    /**
     * 测试连接
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @returns {Promise<Object>} 连接状态
     */
    async testConnection(baseUrl) {
        if (!baseUrl) {
            throw new Error('ChromaDB 服务器地址未配置');
        }

        console.log(`Testing ChromaDB connection to: ${baseUrl}`);
        
        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        
        try {
            // 尝试不同的端点来测试连接（优先使用 v2）
            const endpoints = [
                `${url}api/v2/heartbeat`,
                `${url}api/v2/tenants/default/databases/default/collections`,
                `${url}api/v1/heartbeat`,
                `${url}version`
            ];
            
            for (const endpoint of endpoints) {
                console.log(`Trying endpoint: ${endpoint}`);
                try {
                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`Success with endpoint: ${endpoint}`, data);
                        
                        return {
                            success: true,
                            message: '连接成功',
                            collections: data || [],
                            endpoint: endpoint
                        };
                    }
                } catch (endpointError) {
                    console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
                    // 继续尝试下一个端点
                }
            }
            
            throw new Error('所有端点都无法访问，请检查 ChromaDB 服务器地址和版本');
        } catch (error) {
            console.error('测试连接失败:', error);
            throw error;
        }
    },

    /**
     * 获取集合列表
     * @param {string} baseUrl - ChromaDB 服务器基础 URL
     * @returns {Promise<Array>} 集合列表
     */
    async getCollections(baseUrl) {
        if (!baseUrl) {
            throw new Error('ChromaDB 服务器地址未配置');
        }

        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        // 使用 v2 API
        const endpoint = `${url}api/v2/tenants/default/databases/default/collections`;

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
            return data || [];
        } catch (error) {
            console.error('获取集合列表失败:', error);
            throw new Error(`获取集合列表失败: ${error.message}`);
        }
    }
};

// 如果在浏览器环境中，将 ChromaDBClient 添加到全局作用域
if (typeof window !== 'undefined') {
    window.ChromaDBClient = ChromaDBClient;
}

// 如果在 Service Worker 或其他环境中，导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChromaDBClient;
}