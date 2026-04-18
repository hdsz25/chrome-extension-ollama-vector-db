/**
 * PDF text extraction utility for Chrome Extension
 * Lazy-loads PDF.js (pdf.min.mjs) on first use via dynamic import.
 */
'use strict';

window.PdfReader = {
    _lib: null,

    /**
     * Load PDF.js lazily. Reuses the same instance on subsequent calls.
     */
    async _loadLib() {
        if (this._lib) return this._lib;
        try {
            const url = chrome.runtime.getURL('utils/pdf.min.mjs');
            const lib = await import(url);
            lib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('utils/pdf.worker.min.mjs');
            this._lib = lib;
            return lib;
        } catch (e) {
            console.error('PDF.js 加载失败:', e);
            throw new Error('PDF.js 加载失败，无法处理 PDF 文件: ' + e.message);
        }
    },

    /**
     * Extract plain text from a PDF File object.
     * @param {File} file
     * @param {function} [onProgress] - optional progress callback (pageNum, totalPages)
     * @returns {Promise<string>}
     */
    async extractText(file, onProgress) {
        const pdfjsLib = await this._loadLib();

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        const pageParts = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            if (onProgress) onProgress(pageNum, numPages);
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            // Join items; preserve line breaks by checking y-coordinate shifts
            let lastY = null;
            const lineTokens = [];
            textContent.items.forEach(item => {
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    lineTokens.push('\n');
                }
                lineTokens.push(item.str);
                lastY = item.transform[5];
            });
            const pageText = lineTokens.join(' ').replace(/ \n /g, '\n').trim();
            if (pageText) {
                pageParts.push(`[Page ${pageNum}/${numPages}]\n${pageText}`);
            }
        }

        return pageParts.join('\n\n');
    }
};
