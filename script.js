// Slideshow Management
let currentSlideIndex = 0;
let slideshowInterval;
let touchStartX = 0;
let touchEndX = 0;

function showSlide(index) {
    const wrapper = document.querySelector('.slides-wrapper');
    const dots = document.querySelectorAll('.dot');
    const totalSlides = document.querySelectorAll('.slide').length;
    
    // Wrap around
    if (index >= totalSlides) {
        currentSlideIndex = 0;
    } else if (index < 0) {
        currentSlideIndex = totalSlides - 1;
    } else {
        currentSlideIndex = index;
    }
    
    // Update wrapper position
    const offset = -currentSlideIndex * 100;
    wrapper.style.transform = `translateX(${offset}%)`;
    
    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlideIndex);
    });
}

function currentSlide(index) {
    showSlide(index);
    resetSlideshowTimer();
}

function changeSlide(direction) {
    showSlide(currentSlideIndex + direction);
    resetSlideshowTimer();
}

function autoPlaySlideshow() {
    slideshowInterval = setInterval(() => {
        changeSlide(1);
    }, 5000); // Auto change setiap 5 detik
}

function resetSlideshowTimer() {
    clearInterval(slideshowInterval);
    autoPlaySlideshow();
}

// Touch/Swipe handling
document.addEventListener('DOMContentLoaded', () => {
    // Initialize slideshow
    showSlide(0);
    autoPlaySlideshow();
    
    // Set today's date as default for order-date input
    const today = new Date().toISOString().split('T')[0];
    const orderDateInput = document.getElementById('order-date');
    if (orderDateInput) {
        orderDateInput.value = today;
    }

    const opDateInput = document.getElementById('op-date');
    if (opDateInput) {
        opDateInput.value = today;
    }
    
    const slideshowContainer = document.querySelector('.slideshow-container');
    
    if (slideshowContainer) {
        // Touch events
        slideshowContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        slideshowContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);

        // Mouse drag events (untuk testing di browser desktop)
        let isDown = false;
        slideshowContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            touchStartX = e.clientX;
        });

        slideshowContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
        });

        slideshowContainer.addEventListener('mouseup', (e) => {
            if (!isDown) return;
            isDown = false;
            touchEndX = e.clientX;
            handleSwipe();
        });

        slideshowContainer.addEventListener('mouseleave', () => {
            isDown = false;
        });
    }
});

// Navigation from slideshow
function scrollToMenuItem(elementId) {
    // Find the menu item with cimol-X ID
    const targetIds = {
        'cimol-1': 'cimol-1-item',
        'cimol-5': 'cimol-5-item'
    };
    
    const targetId = targetIds[elementId];
    if (targetId) {
        const element = document.getElementById(targetId);
        if (element) {
            // Scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add highlight effect
            element.classList.add('menu-item-highlight');
            setTimeout(() => {
                element.classList.remove('menu-item-highlight');
            }, 2000);
        }
    }
}

function scrollToCart() {
    // Click the cart tab
    const cartTab = document.querySelector('[data-tab="cart"]');
    if (cartTab) {
        cartTab.click();
    }
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next slide
            changeSlide(1);
        } else {
            // Swipe right - previous slide
            changeSlide(-1);
        }
    }
}

// Login Management
function loginUser(name) {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const opContainer = document.getElementById('operational-container');
    const floatingNav = document.getElementById('floating-navbar');

    if (loginScreen && appContainer) {
        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        if (opContainer) opContainer.classList.add('hidden'); // Ensure operational is hidden
        if (floatingNav) floatingNav.classList.remove('hidden');
        
        // Sinkronisasi tampilan data saat login
        updateCart();
        displayHistory();
        displayCompletedOrders();
        
        showNotification(`Hai ${name}, selamat datang!`);
        updateNavbarActiveState('menu');
    }
}

function showMeme() {
    const overlay = document.getElementById('meme-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        
        // Sembunyikan kembali otomatis setelah 3 detik
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 3000);
        
        // Menutup jika overlay diklik
        overlay.onclick = () => overlay.classList.add('hidden');
    }
}

function logoutUser() {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const opContainer = document.getElementById('operational-container');
    const loginName = document.getElementById('login-name');
    const loginPassword = document.getElementById('login-password');
    const floatingNav = document.getElementById('floating-navbar');

    if (loginScreen && appContainer) {
        appContainer.classList.add('hidden');
        if (opContainer) opContainer.classList.add('hidden');
        if (floatingNav) floatingNav.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        if (loginName) loginName.value = '';
        if (loginPassword) loginPassword.value = '';
        showNotification('Kamu berhasil logout.');
    }
}
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const loginName = document.getElementById('login-name').value.trim();
        const loginPassword = document.getElementById('login-password').value.trim();
        
        if (!loginName || !loginPassword) {
            showNotification('Isi semua data login terlebih dahulu.', 'error');
            return;
        }
        
        if (loginName === 'Bunga' && loginPassword === 'admin123') {
            loginUser(loginName);
        } else {
            showNotification('lau siapa mpruy', 'error');
            showMeme();
        }
    });
}

// Navigation functions for bottom navbar
function navigateToMenu() {
    const appContainer = document.getElementById('app-container');
    const opContainer = document.getElementById('operational-container');
    if (appContainer) {
        appContainer.classList.remove('hidden');
        if (opContainer) opContainer.classList.add('hidden');
        
        // Tambahkan efek transisi halus
        appContainer.classList.remove('page-fade-in');
        void appContainer.offsetWidth; // Trigger reflow untuk merestart animasi
        appContainer.classList.add('page-fade-in');

        showNotification('Kembali ke Menu Utama');
        updateNavbarActiveState('menu');
    }
}

function navigateToOperational() {
    const appContainer = document.getElementById('app-container');
    const opContainer = document.getElementById('operational-container');
    if (opContainer) {
        opContainer.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        
        // Tambahkan efek transisi halus
        opContainer.classList.remove('page-fade-in');
        void opContainer.offsetWidth; // Trigger reflow untuk merestart animasi
        opContainer.classList.add('page-fade-in');

        displayOpHistory(); // Refresh operational history
        showNotification('Beralih ke Halaman Operasional');
        updateNavbarActiveState('operational');
    }
}

function updateNavbarActiveState(activePage) {
    const navMenu = document.getElementById('nav-menu');
    const navOp = document.getElementById('nav-op');
    
    if (navMenu && navOp) {
        navMenu.classList.remove('active');
        navOp.classList.remove('active');
        
        if (activePage === 'menu') navMenu.classList.add('active');
        if (activePage === 'operational') navOp.classList.add('active');
    }
}

// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active');

        // Refresh lists when tabs are clicked
        if (tabName === 'history') displayHistory();
        if (tabName === 'completed') displayCompletedOrders();
    });
});

// Add to Cart
function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1,
            note: ''
        });
    }
    
    updateCart();
    showNotification(`✓ ${name} ditambahkan ke keranjang`);
}

// Update Cart Display
function updateCart() {
    // Simpan status keranjang ke localStorage agar tetap ada setelah logout/refresh
    localStorage.setItem('cart', JSON.stringify(cart));
    
    const cartItemsDiv = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-message">Keranjang masih kosong</p>';
        document.getElementById('total-price').textContent = 'Rp 0';
        return;
    }
    
    let html = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">Rp ${item.price.toLocaleString('id-ID')}</span>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="decreaseQty(${index})">−</button>
                    <span style="width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQty(${index})">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${index})">🗑️</button>
                </div>
                <div class="cart-item-note" style="width: 100%; margin-top: 8px;">
                    <input type="text" 
                           placeholder="Tambahkan catatan (misal: tidak pedas)..." 
                           value="${item.note || ''}" 
                           onchange="updateNote(${index}, this.value)"
                           style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
                </div>
            </div>
        `;
    });
    
    cartItemsDiv.innerHTML = html;
    document.getElementById('total-price').textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

// Increase Quantity
function increaseQty(index) {
    cart[index].quantity++;
    updateCart();
}

// Decrease Quantity
function decreaseQty(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        removeFromCart(index);
    }
    updateCart();
}

function updateNote(index, note) {
    cart[index].note = note;
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Remove from Cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// Clear Cart
function clearCart() {
    if (cart.length === 0) {
        showNotification('Keranjang sudah kosong');
        return;
    }
    
    if (confirm('Yakin ingin menghapus semua item di keranjang?')) {
        cart = [];
        updateCart();
        document.getElementById('checkout-form').reset();
        showNotification('Keranjang telah dikosongkan');
    }
}

// Checkout Form Submission
document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showNotification('❌ Keranjang masih kosong!', 'error');
        return;
    }
    
    // Get form data
    const customerName = document.getElementById('customer-name').value;
    const orderDate = document.getElementById('order-date').value;
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order object
    const order = {
        id: Date.now(),
        name: customerName,
        orderDate: orderDate,
        items: [...cart],
        total: total,
        timestamp: new Date().toLocaleString('id-ID')
    };
    
    // Save to localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart and form
    cart = [];
    updateCart();
    document.getElementById('checkout-form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('order-date').value = today;
    
    showNotification('✓ Pesanan berhasil dicatat!');
    
    // Switch to history tab
    setTimeout(() => {
        document.querySelector('[data-tab="history"]').click();
        displayHistory();
    }, 500);
});

// Display Purchase History
function displayHistory() {
    const historyList = document.getElementById('history-list');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    if (orders.length === 0) {
        historyList.innerHTML = '<p class="empty-message">Tidak ada riwayat penjualan</p>';
        return;
    }
    
    // Group orders by day
    const ordersByDay = {};
    
    orders.forEach(order => {
        const orderDate = new Date(order.orderDate);
        const dayName = orderDate.toLocaleDateString('id-ID', { weekday: 'long' });
        const dateStr = order.orderDate; // Use as key to keep same dates together
        const fullDate = `${dayName} (${orderDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })})`;
        
        if (!ordersByDay[dateStr]) {
            ordersByDay[dateStr] = {
                dayName: fullDate,
                orders: []
            };
        }
        
        ordersByDay[dateStr].orders.push(order);
    });
    
    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(ordersByDay).sort().reverse();
    
    let html = '';
    
    sortedDates.forEach(dateStr => {
        const dayGroup = ordersByDay[dateStr];
        
        // Add day heading
        html += `<div class="history-day-header">${dayGroup.dayName}</div>`;
        
        // Add orders for this day
        dayGroup.orders.forEach(order => {
            const itemsList = order.items.map(item => `${item.name} (${item.quantity}x)${item.note ? ` - ${item.note}` : ''}`).join(', ');
            
            html += `
                <div class="history-item">
                    <div class="history-item-header">
                        <span class="history-item-name">${order.name}</span>
                        <span class="history-item-time">${new Date(order.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="history-item-products">
                        <strong>Pesanan:</strong><br>${itemsList}
                    </div>
                    <div class="history-item-total">
                        Total: Rp ${order.total.toLocaleString('id-ID')}
                    </div>
                    <div class="history-actions">
                        <button class="btn-action finish" onclick="finishOrder(${order.id})">Selesai</button>
                        <button class="btn-action cancel" onclick="cancelOrder(${order.id})">Cancel</button>
                    </div>
                </div>
            `;
        });
    });
    
    historyList.innerHTML = html;
}

// Function to show Completed Orders
function displayCompletedOrders() {
    const completedList = document.getElementById('completed-list');
    const completedOrders = JSON.parse(localStorage.getItem('completedOrders')) || [];
    
    if (completedOrders.length === 0) {
        completedList.innerHTML = '<p class="empty-message">Belum ada pesanan selesai</p>';
        return;
    }

    let html = '';
    let totalSales = 0;

    // Sort completed orders newest first
    [...completedOrders].reverse().forEach(order => {
        const itemsList = order.items.map(item => `${item.name} (${item.quantity}x)${item.note ? ` - ${item.note}` : ''}`).join(', ');
        const isCanceled = order.status === 'Cancel';
        const statusColor = isCanceled ? '#E63946' : '#27AE60';
        const statusText = isCanceled ? 'CANCELED' : 'SELESAI';

        // Hanya tambahkan ke total jika statusnya Selesai (bukan Cancel)
        if (!isCanceled) {
            totalSales += order.total;
        }
        
        html += `
            <div class="history-item" style="border-left-color: ${statusColor}">
                <div class="history-item-header">
                    <span class="history-item-name">${order.name} <small style="color: ${statusColor}; margin-left: 8px;">[${statusText}]</small></span>
                    <span class="history-item-time">${isCanceled ? 'Batal' : 'Selesai'}: ${order.timestamp}</span>
                </div>
                <div class="history-item-products">${itemsList}</div>
                <div class="history-item-total">Total: Rp ${order.total.toLocaleString('id-ID')}</div>
            </div>
        `;
    });

    // Tambahkan box ringkasan total penjualan di bagian bawah
    html += `
        <div class="total-sales-summary" style="position: sticky; bottom: 0; margin-top: 20px; padding: 15px; background: #f1f8f4; border-radius: 8px; border: 2px solid #27AE60; text-align: right; box-shadow: 0 -5px 15px rgba(0,0,0,0.1); z-index: 10;">
            <h3 style="margin: 0; color: #333; font-size: 16px;">Total Penjualan Berhasil:</h3>
            <div style="font-size: 24px; font-weight: bold; color: #27AE60; margin-top: 5px;">Rp ${totalSales.toLocaleString('id-ID')}</div>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">*Menghitung semua pesanan dengan status SELESAI</p>
        </div>
    `;

    completedList.innerHTML = html;
}

// Action Functions
function finishOrder(orderId) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        let completedOrder = orders.splice(orderIndex, 1)[0];
        completedOrder.status = 'Selesai';
        completedOrder.timestamp = new Date().toLocaleString('id-ID'); // Update to finish time
        let completedOrders = JSON.parse(localStorage.getItem('completedOrders')) || [];
        
        completedOrders.push(completedOrder);
        localStorage.setItem('orders', JSON.stringify(orders));
        localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
        
        // Otomatis masukkan ke riwayat buku kas sebagai pemasukan
        const opEntry = {
            id: Date.now() + 1,
            type: 'pemasukan',
            desc: `Penjualan: ${completedOrder.name}`,
            amount: completedOrder.total,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().getTime()
        };
        
        opTransactions.push(opEntry);
        localStorage.setItem('opTransactions', JSON.stringify(opTransactions));

        displayOpHistory();
        displayHistory();
        displayCompletedOrders();
        showNotification('Pesanan berhasil diselesaikan!');
    }
}

function cancelOrder(orderId) {
    if (confirm('Yakin ingin membatalkan pesanan ini?')) {
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex !== -1) {
            let canceledOrder = orders.splice(orderIndex, 1)[0];
            canceledOrder.status = 'Cancel';
            canceledOrder.timestamp = new Date().toLocaleString('id-ID'); // Update to cancel time
            
            let completedOrders = JSON.parse(localStorage.getItem('completedOrders')) || [];
            completedOrders.push(canceledOrder);
            
            localStorage.setItem('orders', JSON.stringify(orders));
            localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
            
            displayHistory();
            displayCompletedOrders();
            showNotification('Pesanan dipindahkan ke Riwayat (Cancel)', 'error');
        }
    }
}

function clearCompletedHistory() {
    if (confirm('Hapus semua riwayat pesanan selesai?')) {
        localStorage.removeItem('completedOrders');
        displayCompletedOrders();
        showNotification('Riwayat selesai dibersihkan');
    }
}

// Clear History
function clearHistory() {
    if (confirm('Yakin ingin menghapus semua riwayat penjualan?')) {
        localStorage.removeItem('orders');
        displayHistory();
        showNotification('Riwayat penjualan telah dihapus');
    }
}

// --- OPERATIONAL MANAGEMENT ---
let opTransactions = JSON.parse(localStorage.getItem('opTransactions')) || [];

const opForm = document.getElementById('operational-form');
if (opForm) {
    opForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const date = document.getElementById('op-date').value;
        const type = document.getElementById('op-type').value;
        const desc = document.getElementById('op-desc').value;
        const amount = parseInt(document.getElementById('op-amount').value);
        
        const newEntry = {
            id: Date.now(),
            type,
            desc,
            amount,
            date: date,
            timestamp: new Date().getTime()
        };
        
        opTransactions.push(newEntry);
        localStorage.setItem('opTransactions', JSON.stringify(opTransactions));
        
        this.reset();
        document.getElementById('op-date').value = new Date().toISOString().split('T')[0];
        displayOpHistory();
        showNotification('Catatan operasional berhasil disimpan');
    });
}

function displayOpHistory() {
    const list = document.getElementById('op-history-list');
    const summary = document.getElementById('op-summary-container');
    if (!list) return;

    if (opTransactions.length === 0) {
        list.innerHTML = '<p class="empty-message">Belum ada catatan operasional</p>';
        summary.innerHTML = '';
        return;
    }

    let html = '';
    let totalIn = 0;
    let totalOut = 0;

    // Urutkan berdasarkan tanggal terbaru
    const sortedOps = [...opTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedOps.forEach(item => {
        const isExpense = item.type === 'pengeluaran';
        if (isExpense) totalOut += item.amount;
        else totalIn += item.amount;

        const formattedDate = new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

        html += `
            <div class="history-item" style="border-left-color: ${isExpense ? '#E63946' : '#27AE60'}">
                <div class="history-item-header">
                    <div style="display: flex; flex-direction: column;">
                        <span class="history-item-name" style="font-size: 15px;">${item.desc}</span>
                        <span style="font-size: 11px; color: ${isExpense ? '#E63946' : '#27AE60'}; font-weight: bold; text-transform: uppercase; margin-top: 4px;">
                            ${item.type}
                        </span>
                    </div>
                    <span class="history-item-date">${formattedDate}</span>
                </div>
                <div class="history-item-total" style="color: ${isExpense ? '#E63946' : '#27AE60'}">
                    ${isExpense ? '-' : '+'} Rp ${item.amount.toLocaleString('id-ID')}
                </div>
            </div>
        `;
    });

    list.innerHTML = html;

    summary.innerHTML = `
        <div class="total-sales-summary op-summary-sticky" style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
                <span>Total Pemasukan:</span>
                <span style="color: #27AE60; font-weight: bold;">Rp ${totalIn.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
                <span>Total Pengeluaran:</span>
                <span style="color: #E63946; font-weight: bold;">Rp ${totalOut.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 10px; font-size: 16px; font-weight: bold;">
                <span>Saldo Netto:</span>
                <span style="color: #2C3E50;">Rp ${(totalIn - totalOut).toLocaleString('id-ID')}</span>
            </div>
        </div>
    `;
}

function clearOpHistory() {
    if (confirm('Hapus semua catatan operasional?')) {
        opTransactions = [];
        localStorage.removeItem('opTransactions');
        displayOpHistory();
        showNotification('Riwayat operasional dibersihkan');
    }
}

// Notification Function
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#E63946' : '#27AE60';

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${bgColor};
        color: white;
        padding: 14px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
