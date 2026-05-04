/**
 * キッチン在庫管理アプリ - メインファイル
 */

class InventoryApp {
    constructor() {
        this.currentEditId = null;
        this.currentDeleteId = null;
        this.searchQuery = '';
        this.filterCategory = '';
        this.sortBy = 'name';
        
        this.init();
    }

    /**
     * アプリケーション初期化
     */
    init() {
        this.bindEvents();
        this.loadInventory();
        this.checkAlerts();
        
        // 定期的にアラートをチェック（1分ごと）
        setInterval(() => {
            this.checkAlerts();
        }, 60000);
    }

    /**
     * イベントリスナーを設定
     */
    bindEvents() {
        // 食材追加ボタン
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.showItemModal();
        });

        // 検索
        document.getElementById('searchInput').addEventListener('input', debounce((e) => {
            this.searchQuery = e.target.value;
            this.loadInventory();
        }, 300));

        // フィルター
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.loadInventory();
        });

        // ソート
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.loadInventory();
        });

        // モーダル関連
        this.bindModalEvents();

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            // Ctrl+N または Cmd+N で新規追加
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showItemModal();
            }
            
            // Escape キーでモーダルを閉じる
            if (e.key === 'Escape') {
                this.hideItemModal();
                this.hideDeleteModal();
            }
        });
    }

    /**
     * モーダル関連のイベントを設定
     */
    bindModalEvents() {
        const itemModal = document.getElementById('itemModal');
        const deleteModal = document.getElementById('deleteModal');
        const itemForm = document.getElementById('itemForm');

        // アイテムモーダルの閉じるボタン
        itemModal.querySelector('.close').addEventListener('click', () => {
            this.hideItemModal();
        });

        // キャンセルボタン
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideItemModal();
        });

        // フォーム送信
        itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        // 削除確認モーダル
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteItem();
        });

        // モーダル外クリックで閉じる
        itemModal.addEventListener('click', (e) => {
            if (e.target === itemModal) {
                this.hideItemModal();
            }
        });

        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                this.hideDeleteModal();
            }
        });
    }

    /**
     * 在庫を読み込み表示
     */
    loadInventory() {
        let items = inventoryStorage.getItems();

        // 検索フィルタ適用
        if (this.searchQuery) {
            items = inventoryStorage.searchItems(this.searchQuery);
        }

        // カテゴリーフィルタ適用
        if (this.filterCategory) {
            items = items.filter(item => item.category === this.filterCategory);
        }

        // ソート適用
        items = inventoryStorage.sortItems(items, this.sortBy);

        this.renderInventory(items);
    }

    /**
     * 在庫一覧を描画
     */
    renderInventory(items) {
        const grid = document.getElementById('inventoryGrid');
        
        if (items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>📦 在庫がありません</h3>
                    <p>「+ 食材追加」ボタンから最初の食材を追加しましょう</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = items.map(item => this.renderInventoryItem(item)).join('');
    }

    /**
     * 在庫アイテムを描画
     */
    renderInventoryItem(item) {
        const stockStatusClass = getStockStatusClass(item.quantity);
        const expiryStatusClass = getExpiryStatusClass(item.expiry);
        const categoryIcon = getCategoryIcon(item.category);
        
        const expiryDisplay = item.expiry 
            ? `<div class="item-expiry ${expiryStatusClass}">
                 📅 ${getRelativeDate(item.expiry)}
               </div>`
            : '';

        const noteDisplay = item.note 
            ? `<div class="item-note">💭 ${escapeHtml(item.note)}</div>`
            : '';

        return `
            <div class="inventory-item fade-in">
                <div class="item-header">
                    <h3 class="item-name">${escapeHtml(item.name)}</h3>
                    <span class="item-category">${categoryIcon} ${escapeHtml(item.category)}</span>
                </div>
                <div class="item-details">
                    <div class="item-quantity ${stockStatusClass}">
                        ${item.quantity} ${escapeHtml(item.unit || '個')}
                    </div>
                    ${expiryDisplay}
                    ${noteDisplay}
                </div>
                <div class="item-actions">
                    <button class="btn btn-warning" onclick="app.showItemModal('${item.id}')">
                        ✏️ 編集
                    </button>
                    <button class="btn btn-danger" onclick="app.showDeleteModal('${item.id}')">
                        🗑️ 削除
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * アイテムモーダルを表示
     */
    showItemModal(itemId = null) {
        this.currentEditId = itemId;
        const modal = document.getElementById('itemModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('itemForm');
        
        // フォームをリセット
        form.reset();
        
        if (itemId) {
            // 編集モード
            title.textContent = '食材編集';
            const item = inventoryStorage.getItemById(itemId);
            if (item) {
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemCategory').value = item.category;
                document.getElementById('itemQuantity').value = item.quantity;
                document.getElementById('itemUnit').value = item.unit || '個';
                document.getElementById('itemExpiry').value = item.expiry || '';
                document.getElementById('itemNote').value = item.note || '';
            }
        } else {
            // 新規追加モード
            title.textContent = '食材追加';
            document.getElementById('itemUnit').value = '個';
        }
        
        modal.style.display = 'block';
        document.getElementById('itemName').focus();
    }

    /**
     * アイテムモーダルを隠す
     */
    hideItemModal() {
        document.getElementById('itemModal').style.display = 'none';
        this.currentEditId = null;
    }

    /**
     * 削除確認モーダルを表示
     */
    showDeleteModal(itemId) {
        this.currentDeleteId = itemId;
        document.getElementById('deleteModal').style.display = 'block';
    }

    /**
     * 削除確認モーダルを隠す
     */
    hideDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
        this.currentDeleteId = null;
    }

    /**
     * アイテムを保存
     */
    saveItem() {
        const formData = {
            name: safeTrim(document.getElementById('itemName').value),
            category: document.getElementById('itemCategory').value,
            quantity: safeParseInt(document.getElementById('itemQuantity').value),
            unit: safeTrim(document.getElementById('itemUnit').value),
            expiry: document.getElementById('itemExpiry').value,
            note: safeTrim(document.getElementById('itemNote').value)
        };

        // バリデーション
        const validation = validateItemForm(formData);
        if (!validation.isValid) {
            showAlert(validation.errors.join('<br>'), 'danger');
            return;
        }

        let success;
        if (this.currentEditId) {
            // 更新
            success = inventoryStorage.updateItem(this.currentEditId, formData);
            if (success) {
                showAlert('食材を更新しました', 'success');
            }
        } else {
            // 新規追加
            success = inventoryStorage.addItem(formData);
            if (success) {
                showAlert('食材を追加しました', 'success');
            }
        }

        if (success) {
            this.hideItemModal();
            this.loadInventory();
            this.checkAlerts();
        } else {
            showAlert('保存に失敗しました', 'danger');
        }
    }

    /**
     * アイテムを削除
     */
    deleteItem() {
        if (!this.currentDeleteId) return;

        const success = inventoryStorage.deleteItem(this.currentDeleteId);
        if (success) {
            showAlert('食材を削除しました', 'success');
            this.hideDeleteModal();
            this.loadInventory();
            this.checkAlerts();
        } else {
            showAlert('削除に失敗しました', 'danger');
        }
    }

    /**
     * アラートをチェック
     */
    checkAlerts() {
        const alertsContainer = document.getElementById('alerts');
        
        // 既存のアラートをクリア（手動で追加されたもの以外）
        const existingAlerts = alertsContainer.querySelectorAll('.alert[data-auto="true"]');
        existingAlerts.forEach(alert => alert.remove());

        const lowStockItems = inventoryStorage.getLowStockItems();
        const expiringItems = inventoryStorage.getExpiringItems();
        const expiredItems = inventoryStorage.getExpiredItems();

        // 期限切れアラート
        if (expiredItems.length > 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger';
            alertDiv.setAttribute('data-auto', 'true');
            alertDiv.innerHTML = `
                <strong>⚠️ 期限切れの食材があります:</strong>
                ${expiredItems.map(item => escapeHtml(item.name)).join(', ')}
            `;
            alertsContainer.appendChild(alertDiv);
        }

        // 期限切れ間近アラート
        if (expiringItems.length > 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning';
            alertDiv.setAttribute('data-auto', 'true');
            alertDiv.innerHTML = `
                <strong>📅 期限が近い食材があります:</strong>
                ${expiringItems.map(item => `${escapeHtml(item.name)} (${getRelativeDate(item.expiry)})`).join(', ')}
            `;
            alertsContainer.appendChild(alertDiv);
        }

        // 在庫切れアラート
        if (lowStockItems.length > 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning';
            alertDiv.setAttribute('data-auto', 'true');
            alertDiv.innerHTML = `
                <strong>📦 在庫が少ない食材があります:</strong>
                ${lowStockItems.map(item => `${escapeHtml(item.name)} (${item.quantity}${escapeHtml(item.unit || '個')})`).join(', ')}
            `;
            alertsContainer.appendChild(alertDiv);
        }
    }

    /**
     * データをエクスポート
     */
    exportData() {
        try {
            const data = inventoryStorage.exportData();
            const filename = `kitchen_inventory_${new Date().toISOString().split('T')[0]}.json`;
            downloadFile(data, filename, 'application/json');
            showAlert('データをエクスポートしました', 'success');
        } catch (error) {
            showAlert('エクスポートに失敗しました', 'danger');
            console.error('Export error:', error);
        }
    }

    /**
     * CSVエクスポート
     */
    exportCSV() {
        try {
            const items = inventoryStorage.getItems();
            const csv = generateCSV(items);
            const filename = `kitchen_inventory_${new Date().toISOString().split('T')[0]}.csv`;
            downloadFile('\ufeff' + csv, filename, 'text/csv'); // BOM付きでExcelでも文字化けしない
            showAlert('CSVファイルをエクスポートしました', 'success');
        } catch (error) {
            showAlert('CSVエクスポートに失敗しました', 'danger');
            console.error('CSV export error:', error);
        }
    }

    /**
     * 統計情報を表示
     */
    showStats() {
        const items = inventoryStorage.getItems();
        const totalItems = items.length;
        const categories = [...new Set(items.map(item => item.category))];
        const lowStockCount = inventoryStorage.getLowStockItems().length;
        const expiringCount = inventoryStorage.getExpiringItems().length;

        const statsMessage = `
            📊 在庫統計情報
            ▫️ 総食材数: ${totalItems}個
            ▫️ カテゴリー数: ${categories.length}種類
            ▫️ 在庫少ない: ${lowStockCount}個
            ▫️ 期限近い: ${expiringCount}個
        `;

        showAlert(statsMessage.replace(/\n\s+/g, '<br>'), 'info', 8000);
    }
}

// アプリケーション開始
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new InventoryApp();
    
    // グローバル関数として公開（HTMLから呼び出すため）
    window.app = app;
    
    console.log('🍳 キッチン在庫管理アプリが起動しました');
});