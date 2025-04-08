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

    // --- 转换2按钮功能 ---
    const convertButton2 = document.getElementById('convertButton2');
    convertButton2.addEventListener('click', () => {
        const input = inputText.value;
        if (!input.trim()) {
            setStatus('输入内容不能为空。', 'orange');
            return;
        }
        try {
            // 调用新的转换函数
            const convertedText = convertMarkdownTableToSMS2(input);
            outputText.value = convertedText;
            // 转换成功后自动复制到剪贴板
            copyToClipboard(convertedText, true); // true 表示是自动复制
        } catch (error) {
            console.error("转换出错:", error);
            setStatus(`转换过程中发生错误: ${error.message}`, 'red');
        }
    });

    // --- 转换3按钮功能 ---
    const convertButton3 = document.getElementById('convertButton3');
    convertButton3.addEventListener('click', () => {
        const input = inputText.value;
        if (!input.trim()) {
            setStatus('输入内容不能为空。', 'orange');
            return;
        }
        try {
            // 调用新的转换函数
            const convertedText = convertMarkdownTableToSMS3(input);
            outputText.value = convertedText;
            // 转换成功后自动复制到剪贴板
            copyToClipboard(convertedText, true); // true 表示是自动复制
        } catch (error) {
            console.error("转换出错:", error);
            setStatus(`转换过程中发生错误: ${error.message}`, 'red');
        }
    });

    // --- 核心转换逻辑 (更新为新逻辑) ---
    function convertMarkdownTableToSMS(markdownText) {
        // 正则表达式匹配 Markdown 表格 (保持不变)
        const tableRegex = /^\s*\|(.+)\|\s*?\n\s*\|[-:|\s]+\|\s*?\n((?:^\s*\|.*\|\s*?\n?)+)/gm;

        // 使用 replace 函数处理每个匹配到的表格
        return markdownText.replace(tableRegex, (match, headerLine, rowLines) => {
            // 1. 解析表头 (保持不变)
            const headers = headerLine
                .split('|')
                .map(h => h.trim())
                .filter(h => h); // 移除因首尾管道符产生的空字符串

            // 2. 解析数据行 (保持不变，slice确保索引正确)
            const rows = rowLines
                .trim() // 去除末尾可能的多余换行符
                .split('\n')
                .map(rowLine =>
                    rowLine
                        .split('|')
                        .map(cell => cell.trim())
                        // slice(1, length - 1) 移除首尾空字符串并对齐数据
                        .slice(1, rowLine.split('|').length - 1)
                );

            // 3. 格式化输出 (应用新逻辑)
            let smsOutput = ''; // 用于存储整个表格转换后的文本
            rows.forEach((rowCells, rowIndex) => {
                // 检查并修正行单元格数量与表头数量（除第一个外）的匹配
                const expectedCellCount = headers.length;
                 if (!rowCells || rowCells.length < expectedCellCount) {
                    // console.warn(`Row ${rowIndex + 1} has fewer cells than headers. Padding with empty strings.`);
                    while (rowCells.length < expectedCellCount) {
                        rowCells.push('');
                    }
                 } else if (rowCells.length > expectedCellCount) {
                    // console.warn(`Row ${rowIndex + 1} has more cells than headers. Truncating.`);
                    rowCells = rowCells.slice(0, expectedCellCount);
                 }

                const rowTitle = rowCells[0] || ''; // 获取第一列的值（行标题）
                let rowOutputLines = []; // 存储当前原始行转换后的所有行文本

                // 遍历表头和单元格，跳过第一个表头和第一个单元格 (headerIndex > 0)
                headers.forEach((currentHeader, headerIndex) => {
                    // 从第二个表头（索引为1）开始处理
                    if (headerIndex > 0) {
                        const currentCellValue = rowCells[headerIndex] || ''; // 获取当前单元格的值
                        // 组合格式： 列标题，行标题呢： 单元格值。
                        // 注意：根据示例，在 "呢：" 前后添加了空格，保持一致性
                        rowOutputLines.push(`${currentHeader}，${rowTitle}呢： ${currentCellValue}。`);
                    }
                });

                // 将当前原始行生成的所有文本行用换行符连接起来
                smsOutput += rowOutputLines.join('\n');

                // 在不同原始行转换出的文本块之间添加两个空行（即三个换行符）
                // 确保不是最后一行才添加分隔符
                if (rowIndex < rows.length - 1) {
                    smsOutput += '\n\n\n';
                }
            });

            // 只返回转换后的表格内容。
            // replace 函数会自动将 markdownText 中匹配的部分替换为这个返回值
            // 表格前后的原始文本会保留
            return smsOutput;
        });
    }

    // --- 核心转换逻辑 (转换2) ---
    function convertMarkdownTableToSMS2(markdownText) {
        // 正则表达式匹配 Markdown 表格 (保持不变)
        const tableRegex = /^\s*\|(.+)\|\s*?\n\s*\|[-:|\s]+\|\s*?\n((?:^\s*\|.*\|\s*?\n?)+)/gm;

        // 使用 replace 函数处理每个匹配到的表格
        return markdownText.replace(tableRegex, (match, headerLine, rowLines) => {
            // 1. 解析表头 (保持不变)
            const headers = headerLine
                .split('|')
                .map(h => h.trim())
                .filter(h => h); // 移除因首尾管道符产生的空字符串

            // 2. 解析数据行 (保持不变，slice确保索引正确)
            const rows = rowLines
                .trim() // 去除末尾可能的多余换行符
                .split('\n')
                .map(rowLine =>
                    rowLine
                        .split('|')
                        .map(cell => cell.trim())
                        // slice(1, length - 1) 移除首尾空字符串并对齐数据
                        .slice(1, rowLine.split('|').length - 1)
                );

            // 3. 格式化输出 (应用新逻辑)
            let smsOutput = ''; // 用于存储整个表格转换后的文本
            rows.forEach((rowCells, rowIndex) => {
                // 检查并修正行单元格数量与表头数量（除第一个外）的匹配
                const expectedCellCount = headers.length;
                 if (!rowCells || rowCells.length < expectedCellCount) {
                    // console.warn(`Row ${rowIndex + 1} has fewer cells than headers. Padding with empty strings.`);
                    while (rowCells.length < expectedCellCount) {
                        rowCells.push('');
                    }
                 } else if (rowCells.length > expectedCellCount) {
                    // console.warn(`Row ${rowIndex + 1} has more cells than headers. Truncating.`);
                    rowCells = rowCells.slice(0, expectedCellCount);
                 }

                const rowTitle = rowCells[0] || ''; // 获取第一列的值（行标题）
                let rowOutputLines = []; // 存储当前原始行转换后的所有行文本

                // 遍历表头和单元格，跳过第一个表头和第一个单元格 (headerIndex > 0)
                headers.forEach((currentHeader, headerIndex) => {
                    // 从第二个表头（索引为1）开始处理
                    if (headerIndex > 0) {
                        const currentCellValue = rowCells[headerIndex] || ''; // 获取当前单元格的值
                        // 组合格式： 列标题，行标题呢： \n 单元格值。
                        // 注意：根据示例，在 "呢：" 后添加了换行符
                        rowOutputLines.push(`${currentHeader}，${rowTitle}呢： \n ${currentCellValue}。`);
                    }
                });

                // 将当前原始行生成的所有文本行用换行符连接起来
                smsOutput += rowOutputLines.join('\n');

                // 在不同原始行转换出的文本块之间添加两个空行（即三个换行符）
                // 确保不是最后一行才添加分隔符
                if (rowIndex < rows.length - 1) {
                    smsOutput += '\n\n\n';
                }
            });

            // 只返回转换后的表格内容。
            // replace 函数会自动将 markdownText 中匹配的部分替换为这个返回值
            // 表格前后的原始文本会保留
            return smsOutput;
        });
    }

    // --- 核心转换逻辑 (转换3) ---
    function convertMarkdownTableToSMS3(markdownText) {
        // 正则表达式匹配 Markdown 表格 (保持不变)
        const tableRegex = /^\s*\|(.+)\|\s*?\n\s*\|[-:|\s]+\|\s*?\n((?:^\s*\|.*\|\s*?\n?)+)/gm;

        // 使用 replace 函数处理每个匹配到的表格
        return markdownText.replace(tableRegex, (match, headerLine, rowLines) => {
            // 1. 解析表头 (保持不变)
            const headers = headerLine
                .split('|')
                .map(h => h.trim())
                .filter(h => h); // 移除因首尾管道符产生的空字符串

            // 2. 解析数据行 (保持不变，slice确保索引正确)
            const rows = rowLines
                .trim() // 去除末尾可能的多余换行符
                .split('\n')
                .map(rowLine =>
                    rowLine
                        .split('|')
                        .map(cell => cell.trim())
                        // slice(1, length - 1) 移除首尾空字符串并对齐数据
                        .slice(1, rowLine.split('|').length - 1)
                );

            // 3. 格式化输出 (应用新逻辑)
            let smsOutput = ''; // 用于存储整个表格转换后的文本
            rows.forEach((rowCells, rowIndex) => {
                // 检查并修正行单元格数量与表头数量（除第一个外）的匹配
                const expectedCellCount = headers.length;
                 if (!rowCells || rowCells.length < expectedCellCount) {
                    // console.warn(`Row ${rowIndex + 1} has fewer cells than headers. Padding with empty strings.`);
                    while (rowCells.length < expectedCellCount) {
                        rowCells.push('');
                    }
                 } else if (rowCells.length > expectedCellCount) {
                    // console.warn(`Row ${rowIndex + 1} has more cells than headers. Truncating.`);
                    rowCells = rowCells.slice(0, expectedCellCount);
                 }

                const rowTitle = rowCells[0] || ''; // 获取第一列的值（行标题）
                let rowOutputLines = []; // 存储当前原始行转换后的所有行文本

                // 遍历表头和单元格，跳过第一个表头和第一个单元格 (headerIndex > 0)
                headers.forEach((currentHeader, headerIndex) => {
                    // 从第二个表头（索引为1）开始处理
                    if (headerIndex > 0) {
                        const currentCellValue = rowCells[headerIndex] || ''; // 获取当前单元格的值
                        // 组合格式： 列标题，\n 行标题呢： \n 单元格值。
                        // 注意：根据示例，在 "呢：" 后添加了换行符
                        rowOutputLines.push(`${currentHeader}，\n ${rowTitle}呢： \n ${currentCellValue}。`);
                    }
                });

                // 将当前原始行生成的所有文本行用换行符连接起来
                smsOutput += rowOutputLines.join('\n');

                // 在不同原始行转换出的文本块之间添加两个空行（即三个换行符）
                // 确保不是最后一行才添加分隔符
                if (rowIndex < rows.length - 1) {
                    smsOutput += '\n\n\n';
                }
            });

            // 只返回转换后的表格内容。
            // replace 函数会自动将 markdownText 中匹配的部分替换为这个返回值
            // 表格前后的原始文本会保留
            return smsOutput;
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