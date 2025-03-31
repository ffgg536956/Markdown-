document.addEventListener('DOMContentLoaded', () => {
    // 获取元素
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const pasteButton = document.getElementById('pasteButton');
    const convertButton = document.getElementById('convertButton');
    const copyButton = document.getElementById('copyButton');
    const clearInputButton = document.getElementById('clearInputButton'); // 获取新按钮
    const statusMessage = document.getElementById('statusMessage');

    // --- 粘贴按钮功能 ---
    pasteButton.addEventListener('click', async () => {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
                const text = await navigator.clipboard.readText();
                inputText.value = text;
                setStatus('已从剪贴板粘贴内容。', 'green');
            } else {
                setStatus('浏览器不支持自动读取剪贴板，请手动粘贴。', 'orange');
                inputText.focus();
            }
        } catch (err) {
            console.error('无法读取剪贴板内容: ', err);
            setStatus('无法读取剪贴板，请检查权限或手动粘贴。', 'red');
        }
    });

    // --- 清除输入框按钮功能 --- (新增)
    clearInputButton.addEventListener('click', () => {
        inputText.value = ''; // 清空输入框
        outputText.value = ''; // 同时清空输出框可能更友好
        setStatus('输入框已清除。', 'gray'); // 使用灰色表示中性信息
        inputText.focus(); // 将焦点移回输入框
    });

    // --- 转换按钮功能 ---
    convertButton.addEventListener('click', () => {
        const input = inputText.value;
        if (!input.trim()) {
            setStatus('输入内容不能为空。', 'orange');
            return;
        }
        try {
            const convertedText = convertMarkdownTableToSMS(input);
            outputText.value = convertedText;
            // 转换成功后自动复制到剪贴板
            copyToClipboard(convertedText, true); // true 表示是自动复制
        } catch (error) {
            console.error("转换出错:", error);
            setStatus(`转换过程中发生错误: ${error.message}`, 'red');
        }
    });

    // --- 复制结果按钮功能 ---
    copyButton.addEventListener('click', () => {
        const output = outputText.value;
        if (!output.trim()) {
            setStatus('没有可复制的内容。', 'orange');
            return;
        }
        copyToClipboard(output, false); // false 表示是手动复制
    });

    // --- 核心转换逻辑 (保持不变) ---
    function convertMarkdownTableToSMS(markdownText) {
        // 正则表达式匹配 Markdown 表格
        const tableRegex = /^\s*\|(.+)\|\s*?\n\s*\|[-:|\s]+\|\s*?\n((?:^\s*\|.*\|\s*?\n?)+)/gm;

        return markdownText.replace(tableRegex, (match, headerLine, rowLines) => {
            // 1. 解析表头
            const headers = headerLine
                .split('|')
                .map(h => h.trim())
                .filter(h => h);

            // 2. 解析数据行
            const rows = rowLines
                .trim()
                .split('\n')
                .map(rowLine =>
                    rowLine
                        .split('|')
                        .map(cell => cell.trim())
                        .filter((cell, index, arr) => index > 0 && index < arr.length - 1)
                );

            // 3. 格式化输出
            let smsOutput = '';
            rows.forEach((rowCells, rowIndex) => {
                let rowRepresentation = [];
                headers.forEach((header, headerIndex) => {
                    const cellValue = rowCells[headerIndex] || '';
                    if (headerIndex === 0) {
                        rowRepresentation.push(` ${header}：${cellValue}；`);
                    } else {
                        rowRepresentation.push(`${header}  呢： ${cellValue}；`);
                    }
                });
                smsOutput += rowRepresentation.join('\n') + (rowIndex < rows.length - 1 ? '\n\n' : '');
            });

            return '\n' + smsOutput + '\n\n';
        });
    }

    // --- 复制到剪贴板的辅助函数 (保持不变) ---
    async function copyToClipboard(text, isAuto = false) {
         try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
                const message = isAuto ? '转换结果已自动复制到剪贴板！' : '结果已复制到剪贴板！';
                setStatus(message, 'green');
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    const message = isAuto ? '转换结果已自动复制到剪贴板 (备用方法)！' : '结果已复制到剪贴板 (备用方法)！';
                    setStatus(message, 'green');
                } catch (err) {
                    setStatus('复制失败，浏览器不支持或权限不足。请手动复制。', 'red');
                }
                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error('复制到剪贴板失败: ', err);
            const message = isAuto ? '自动复制失败，请手动复制。' : '复制失败，请手动复制。';
            setStatus(message + ' 错误: ' + err.message, 'red');
        }
    }

    // --- 设置状态消息的辅助函数 (添加了灰色支持) ---
    function setStatus(message, color = '#e0e0e0') { // 默认颜色改为浅色
        statusMessage.textContent = message;
        // 使用内联样式设置颜色，因为CSS中的!important更强
        statusMessage.style.color = color;

        // 可选：一段时间后清除消息
        // setTimeout(() => { statusMessage.textContent = ''; statusMessage.style.color = ''; }, 5000);
    }
});