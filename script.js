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
            // 检查 clipboard API 和 readText 是否可用
            if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
                const text = await navigator.clipboard.readText();
                inputText.value = text;
                setStatus('已从剪贴板粘贴内容。', 'green');
            } else {
                setStatus('浏览器不支持自动读取剪贴板，请手动粘贴。', 'orange');
                // 可以选择聚焦输入框，方便用户手动粘贴
                inputText.focus();
            }
        } catch (err) {
            console.error('无法读取剪贴板内容: ', err);
            setStatus('无法读取剪贴板，请检查权限或手动粘贴。', 'red');
        }
    });

    // --- 清除输入框按钮功能 ---
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
            // 调用 *更新后* 的转换函数
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

    // --- 核心转换逻辑 (已更新为新逻辑) ---
    function convertMarkdownTableToSMS(markdownText) {
        // 正则表达式匹配 Markdown 表格 (保持不变)
        const tableRegex = /^\s*\|(.+)\|\s*?\n\s*\|[-:|\s]+\|\s*?\n((?:^\s*\|.*\|\s*?\n?)+)/gm;

        return markdownText.replace(tableRegex, (match, headerLine, rowLines) => {
            // 1. 解析表头 (保持不变)
            const headers = headerLine
                .split('|')
                .map(h => h.trim())
                .filter(h => h); // 移除因首尾管道符产生的空字符串

            // 2. 解析数据行 (稍作调整以方便索引)
            const rows = rowLines
                .trim() // 去除末尾可能的多余换行符
                .split('\n')
                .map(rowLine =>
                    rowLine
                        .split('|')
                        .map(cell => cell.trim())
                        // .slice(1, -1) 确保索引与 headers 匹配
                        .slice(1, rowLine.split('|').length - 1)
                );

            // 3. 格式化输出 (应用新逻辑)
            let smsOutput = '';
            rows.forEach((rowCells, rowIndex) => {
                // 确保行单元格数量与表头匹配 (简单检查)
                 if (!rowCells || rowCells.length < headers.length) {
                    // 如果行数据不完整，可能需要跳过或填充空值，这里选择填充
                    // console.warn(`Row ${rowIndex + 1} has fewer cells than headers. Padding with empty strings.`);
                    while (rowCells.length < headers.length) {
                        rowCells.push('');
                    }
                 } else if (rowCells.length > headers.length) {
                    // 如果行数据过多，截断多余部分
                    // console.warn(`Row ${rowIndex + 1} has more cells than headers. Truncating.`);
                    rowCells = rowCells.slice(0, headers.length);
                 }


                const firstHeader = headers[0];
                const firstCellValue = rowCells[0] || ''; // 获取第一列单元格的值

                let rowOutputLines = []; // 存储当前原始行转换后的所有行文本

                headers.forEach((currentHeader, headerIndex) => {
                    const currentCellValue = rowCells[headerIndex] || ''; // 获取当前单元格的值

                    // 添加当前 表头：值 对
                    if (headerIndex === 0) {
                        // 第一项的格式稍有不同 (根据原始示例)
                        rowOutputLines.push(`${currentHeader}呢：${currentCellValue}；`);
                    } else {
                        // 后续项的格式
                        rowOutputLines.push(`${currentHeader}呢： ${currentCellValue}；`);
                    }

                    // --- 新逻辑核心：重复第一列信息 ---
                    // 在处理完第 2、4、6... 列数据后（即 headerIndex 为 1、3、5... 时）
                    // 并且后面还有列时，重复第一列的 表头：值，并加一个空行
                    if (headerIndex > 0 && headerIndex % 2 !== 0 && headerIndex < headers.length - 1) {
                       // 添加重复的第一列信息
                       rowOutputLines.push(`${firstHeader}呢：${firstCellValue}；`);
                       // 添加一个空行（通过 join('\n') 实现）
                       rowOutputLines.push('');
                    }
                });

                // 将当前原始行生成的所有文本行用换行符连接起来
                smsOutput += rowOutputLines.join('\n');

                // 在不同原始行转换出的文本块之间添加两个空行（即三个换行符）
                if (rowIndex < rows.length - 1) {
                    smsOutput += '\n\n\n';
                }
            });

            // 在整个转换后的表格文本前后添加空行（前一个，后两个）
            return '\n' + smsOutput + '\n\n';
        });
    }

    // --- 复制到剪贴板的辅助函数 (保持不变) ---
    async function copyToClipboard(text, isAuto = false) {
         try {
            // 优先使用 navigator.clipboard API
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
                const message = isAuto ? '转换结果已自动复制到剪贴板！' : '结果已复制到剪贴板！';
                setStatus(message, 'green');
            } else {
                // 备用方法：使用 document.execCommand
                const textArea = document.createElement("textarea");
                textArea.value = text;
                // 防止页面滚动
                textArea.style.position = "fixed";
                textArea.style.top = "0";
                textArea.style.left = "-9999px"; // 移出屏幕外
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    const message = isAuto ? '转换结果已自动复制到剪贴板 (备用方法)！' : '结果已复制到剪贴板 (备用方法)！';
                    setStatus(message, 'green');
                } catch (err) {
                    console.error('备用复制方法失败: ', err);
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

    // --- 设置状态消息的辅助函数 (保持不变) ---
    function setStatus(message, color = '#e0e0e0') { // 深色模式下默认文字颜色
        statusMessage.textContent = message;
        // 直接设置内联样式，确保颜色生效 (尤其是在CSS中使用 !important 时需要注意优先级)
        statusMessage.style.color = color;

        // 可以选择性地在一段时间后清除消息
        // setTimeout(() => {
        //    statusMessage.textContent = '';
        //    statusMessage.style.color = ''; // 恢复默认颜色
        // }, 5000); // 5秒后清除
    }
}); // 结束 DOMContentLoaded 事件监听器