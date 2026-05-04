/**
 * ユーティリティ関数集
 */

/**
 * 日付フォーマット関数
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
}

/**
 * 相対日付を取得（○日前/○日後）
 */
function getRelativeDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    
    // 時間を0にして日付のみで比較
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `${Math.abs(diffDays)}日前に期限切れ`;
    } else if (diffDays === 0) {
        return '今日が期限';
    } else if (diffDays === 1) {
        return '明日が期限';
    } else if (diffDays <= 7) {
        return `あと${diffDays}日`;
    } else {
        return formatDate(dateString);
    }
}

/**
 * 消費期限の状態を取得
 */
function getExpiryStatus(dateString, warningDays = 7) {
    if (!dateString) return 'normal';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'expired'; // 期限切れ
    } else if (diffDays <= 3) {
        return 'danger'; // 危険（3日以内）
    } else if (diffDays <= warningDays) {
        return 'warning'; // 警告（7日以内）
    } else {
        return 'normal'; // 正常
    }
}

/**
 * 在庫の状態を取得
 */
function getStockStatus(quantity, lowStockThreshold = 3) {
    if (quantity <= 0) {
        return 'out'; // 在庫切れ
    } else if (quantity <= lowStockThreshold) {
        return 'low'; // 少ない
    } else {
        return 'normal'; // 正常
    }
}

/**
 * 数値を安全にパース
 */
function safeParseInt(value, defaultValue = 0) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 文字列を安全にトリム
 */
function safeTrim(value) {
    return value ? value.toString().trim() : '';
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * デバウンス関数
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * カテゴリーアイコンを取得
 */
function getCategoryIcon(category) {
    const icons = {
        '野菜': '🥬',
        '肉類': '🥩',
        '魚類': '🐟',
        '乳製品': '🥛',
        '調味料': '🧂',
        'レトルト': '🥫',
        'カップ麺': '🍜',
        '冷凍食品': '❄️',
        'その他': '📦'
    };
    return icons[category] || '📦';
}

/**
 * 在庫状態のクラス名を取得
 */
function getStockStatusClass(quantity, lowStockThreshold = 3) {
    const status = getStockStatus(quantity, lowStockThreshold);
    switch (status) {
        case 'out':
            return 'quantity-critical';
        case 'low':
            return 'quantity-low';
        default:
            return 'quantity-normal';
    }
}

/**
 * 消費期限状態のクラス名を取得
 */
function getExpiryStatusClass(dateString) {
    const status = getExpiryStatus(dateString);
    switch (status) {
        case 'expired':
        case 'danger':
            return 'expiry-danger';
        case 'warning':
            return 'expiry-warning';
        default:
            return 'expiry-normal';
    }
}

/**
 * アラートメッセージを表示
 */
function showAlert(message, type = 'info', duration = 5000) {
    const alertsContainer = document.getElementById('alerts');
    if (!alertsContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <button type="button" class="btn-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    alertsContainer.appendChild(alertDiv);
    
    // 自動削除
    if (duration > 0) {
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, duration);
    }
}

/**
 * 確認ダイアログを表示
 */
function showConfirmDialog(message, onConfirm, onCancel = null) {
    if (confirm(message)) {
        if (onConfirm) onConfirm();
    } else {
        if (onCancel) onCancel();
    }
}

/**
 * ローディング表示の制御
 */
function setLoading(show, message = '読み込み中...') {
    let loadingElement = document.getElementById('loading');
    
    if (show) {
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loading';
            loadingElement.className = 'loading-overlay';
            loadingElement.innerHTML = `
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p>${escapeHtml(message)}</p>
                </div>
            `;
            document.body.appendChild(loadingElement);
        }
        loadingElement.style.display = 'flex';
    } else {
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

/**
 * フォームデータを検証
 */
function validateItemForm(formData) {
    const errors = [];
    
    if (!formData.name || !safeTrim(formData.name)) {
        errors.push('食材名は必須です');
    }
    
    if (!formData.category || !safeTrim(formData.category)) {
        errors.push('カテゴリーは必須です');
    }
    
    if (formData.quantity === undefined || formData.quantity === null || formData.quantity < 0) {
        errors.push('数量は0以上で入力してください');
    }
    
    if (formData.expiry && formData.expiry !== '') {
        const expiryDate = new Date(formData.expiry);
        if (isNaN(expiryDate.getTime())) {
            errors.push('有効な消費期限を入力してください');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * CSVエクスポート用データを生成
 */
function generateCSV(items) {
    const headers = ['食材名', 'カテゴリー', '数量', '単位', '消費期限', 'メモ', '作成日'];
    const csvContent = [
        headers.join(','),
        ...items.map(item => [
            `"${item.name || ''}"`,
            `"${item.category || ''}"`,
            item.quantity || 0,
            `"${item.unit || ''}"`,
            item.expiry || '',
            `"${(item.note || '').replace(/"/g, '""')}"`,
            item.createdAt ? formatDate(item.createdAt) : ''
        ].join(','))
    ].join('\n');
    
    return csvContent;
}

/**
 * ファイルダウンロード
 */
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 現在の日時をフォーマット
 */
function getCurrentDateTime() {
    return new Date().toISOString();
}

/**
 * 配列をシャッフル
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}