// --- FIREBASE CONFIGURATION & INITIALIZATION ---
// 1. Import modul Firebase versi modern (Modular) yang dibutuhkan website kamu
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDx9OS6ZhJx3_4VTvyyhm52o7lFIIOETmY",
  authDomain: "cimolceria-d1f24.firebaseapp.com",
  projectId: "cimolceria-d1f24",
  storageBucket: "cimolceria-d1f24.firebasestorage.app",
  messagingSenderId: "41841872278",
  appId: "1:41841872278:web:aee2b572b9aa80a3d861b7",
  measurementId: "G-8E759S9KC0"
};

// 2. Inisialisasi Firebase & Firestore Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global Data Variables
let cart = [];
let opTransactions = [];
let orders = [];
let completedOrders = [];
let currentUser = null;
let isCloudLoaded = false; // Mencegah data kosong menimpa data cloud
let unsubscribe = null; // Listener sinkronisasi cloud

// Slideshow Management
let currentSlideIndex = 0;
let slideshowInterval;
let touchStartX = 0;
let touchEndX = 0;

function showSlide(index) {
    const wrapper = document.querySelector('.slides-wrapper');
    const dots = document.querySelectorAll('.dot');
    const totalSlides = document.querySelectorAll('.slide').length;
    
    if (!wrapper) return; // Guard clause jika element belum ada

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
    const targetIds = {
        'cimol-1': 'cimol-1-item',
        'cimol-5': 'cimol-5-item'
    };
    
    const targetId = targetIds[elementId];
    if (targetId) {
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('menu-item-highlight');
            setTimeout(() => {
                element.classList.remove('menu-item-highlight');
            }, 2000);
        }
    }
}

function scrollToCart() {
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
            changeSlide(1);
        } else {
            changeSlide(-1);
        }
    }
}

// Login Management
function loginUser(name) {
    const docId = name.toLowerCase().trim(); // Memastikan nama bersih dari spasi dan huruf kapital
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const opContainer = document.getElementById('operational-container');
    const floatingNav = document.getElementById('floating-navbar');

    if (loginScreen && appContainer) {
        // Tarik cadangan lokal sementara sebelum terhubung ke cloud
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        opTransactions = JSON.parse(localStorage.getItem('opTransactions')) || [];
        orders = JSON.parse(localStorage.getItem('orders')) || [];
        completedOrders = JSON.parse(localStorage.getItem('completedOrders')) || [];
        
        currentUser = docId;
        isCloudLoaded = false; 

        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        if (opContainer) opContainer.classList.add('hidden');
        if (floatingNav) floatingNav.classList.remove('hidden');

        // SINKRONISASI CLOUD UPDATE (Real-time Sync Menggunakan SDK Modular)
        if (db) {
            showNotification('Menghubungkan ke Cloud...', 'info');
            
            if (unsubscribe) unsubscribe(); // Lepas listener lama jika ada
            
            // Menggunakan fungsi doc() dan onSnapshot() versi modular
            unsubscribe = onSnapshot(doc(db, 'users', docId), (snapshot) => {
                isCloudLoaded = true; 
                
                if (snapshot.exists()) {
                    const cloudData = snapshot.data();
                    cart = cloudData.cart || [];
                    opTransactions = cloudData.opTransactions || [];
                    orders = cloudData.orders || [];
                    completedOrders = cloudData.completedOrders || [];
                    
                    saveLocal(); // Amankan data baru ke memori internal browser
                }
                // FIX: Memaksa tablet menggambar ulang UI begitu data real-time masuk
                renderAllUI(); 
            }, (error) => {
                console.error("Gagal sinkron cloud:", error);
                showNotification('Gagal sinkronisasi cloud.', 'error');
            });
        } else {
            alert("Firebase belum dikonfigurasi! Data hanya tersimpan di perangkat ini.");
            renderAllUI();
            showNotification('Mode Offline: Firebase belum diatur.', 'error');
        }
        
        renderAllUI();
        updateNavbarActiveState('menu');
        showNotification(`Halo ${name}!`);
    }
}

function renderAllUI() {
    renderCartUI();
    displayHistory();
    displayCompletedOrders();
    displayOpHistory();
}

// Helper untuk simpan data ke Local & Cloud secara bersamaan
function saveAllData() {
    saveLocal();
    // Menggunakan setDoc() versi modular untuk mengganti db.collection().doc().set()
    if (db && currentUser && isCloudLoaded) {
        setDoc(doc(db, 'users', currentUser), {
            cart: cart,
            opTransactions: opTransactions,
            orders: orders,
            completedOrders: completedOrders
        }).catch(err => console.error("Cloud Save Error:", err));
    }
}

function saveLocal() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('opTransactions', JSON.stringify(opTransactions));
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
}

function showMeme() {
    const overlay = document.getElementById('meme-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 3000);
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
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        currentUser = null;
        appContainer.classList.add('hidden');
        if (opContainer) opContainer.classList.add('hidden');
        if (floatingNav) floatingNav.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        if (loginName) loginName.value = '';
        if (loginPassword) loginPassword.value = '';
        showNotification('Kamu berhasil logout. Data hanya tersimpan di perangkat ini.');
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
        
        // FIX: Supaya tidak sensitif huruf besar/kecil saat login nama "Bunga" atau "bunga"
        if (loginName.toLowerCase() === 'bunga' && loginPassword === 'admin123') {
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
        
        appContainer.classList.remove('page-fade-in');
        void appContainer.offsetWidth; 
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
        
        opContainer.classList.remove('page-fade-in');
        void opContainer.offsetWidth; 
        opContainer.classList.add('page-fade-in');

        displayOpHistory(); 
        showNotification('Beralih ke Halaman Operasional');
        updateNavbarActiveState('operational');
    }
}

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        btn.classList.add('active');
        const targetTab = document.getElementById(tabName);
        if (targetTab) targetTab.classList.add('active');

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

function updateCart() {
    saveAllData(); 
    renderCartUI();
}

function renderCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    if (!cartItemsDiv) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-message">Keranjang masih kosong</p>';
        const totalDiv = document.getElementById('total-price');
        if (totalDiv) totalDiv.textContent = 'Rp 0';
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
    const totalDiv = document.getElementById('total-price');
    if (totalDiv) totalDiv.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

function increaseQty(index) {
    cart[index].quantity++;
    updateCart();
}

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
    saveAllData();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function clearCart() {
    if (cart.length === 0) {
        showNotification('Keranjang sudah kosong');
        return;
    }
    
    if (confirm('Yakin ingin menghapus semua item di keranjang?')) {
        cart = [];
        updateCart();
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) checkoutForm.reset();
        showNotification('Keranjang telah dikosongkan');
    }
}

// Checkout Form Submission
const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (cart.length === 0) {
            showNotification('❌ Keranjang masih kosong!', 'error');
            return;
        }
        
        const customerName = document.getElementById('customer-name').value;
        const orderDate = document.getElementById('order-date').value;
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const order = {
            id: Date.now(),
            name: customerName,
            orderDate: orderDate,
            items: [...cart],
            total: total,
            timestamp: new Date().toISOString()
        };
        
        orders.push(order);
        saveAllData();
        
        cart = [];
        updateCart();
        this.reset();
        const today = new Date().toISOString().split('T')[0];
        const orderDateInput = document.getElementById('order-date');
        if (orderDateInput) orderDateInput.value = today;
        
        showNotification('✓ Pesanan berhasil dicatat!');
        
        setTimeout(() => {
            const histTab = document.querySelector('[data-tab="history"]');
            if (histTab) histTab.click();
            displayHistory();
        }, 500);
    });
}

// Display Purchase History
function displayHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    if (orders.length === 0) {
        historyList.innerHTML = '<p class="empty-message">Tidak ada riwayat penjualan</p>';
        return;
    }
    
    const ordersByDay = {};
    
    orders.forEach(order => {
        const orderDate = new Date(order.orderDate);
        const dayName = orderDate.toLocaleDateString('id-ID', { weekday: 'long' });
        const dateStr = order.orderDate; 
        const fullDate = `${dayName} (${orderDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })})`;
        
        if (!ordersByDay[dateStr]) {
            ordersByDay[dateStr] = {
                dayName: fullDate,
                orders: []
            };
        }
        
        ordersByDay[dateStr].orders.push(order);
    });
    
    const sortedDates = Object.keys(ordersByDay).sort().reverse();
    let html = '';
    
    sortedDates.forEach(dateStr => {
        const dayGroup = ordersByDay[dateStr];
        html += `<div class="history-day-header">${dayGroup.dayName}</div>`;
        
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
                        <button class="btn-action finish" data-id="${order.id}">Selesai</button>
                        <button class="btn-action edit" data-id="${order.id}">Edit</button>
                        <button class="btn-action cancel" data-id="${order.id}">Cancel</button>
                    </div>
                </div>
            `;
        });
    });
    
    historyList.innerHTML = html;

    // Pasang Event Listener dinamis untuk tombol aksi di history
    historyList.querySelectorAll('.btn-action.finish').forEach(btn => {
        btn.onclick = () => finishOrder(parseInt(btn.getAttribute('data-id')));
    });
    historyList.querySelectorAll('.btn-action.cancel').forEach(btn => {
        btn.onclick = () => cancelOrder(parseInt(btn.getAttribute('data-id')));
    });
    historyList.querySelectorAll('.btn-action.edit').forEach(btn => {
        btn.onclick = () => editOrder(parseInt(btn.getAttribute('data-id')));
    });
}

function displayCompletedOrders() {
    const completedList = document.getElementById('completed-list');
    if (!completedList) return;

    if (completedOrders.length === 0) {
        completedList.innerHTML = '<p class="empty-message">Belum ada pesanan selesai</p>';
        return;
    }

    let html = '';
    let totalSales = 0;

    [...completedOrders].reverse().forEach(order => {
        const itemsList = order.items.map(item => `${item.name} (${item.quantity}x)${item.note ? ` - ${item.note}` : ''}`).join(', ');
        const isCanceled = order.status === 'Cancel';
        const statusColor = isCanceled ? '#E63946' : '#27AE60';
        const statusText = isCanceled ? 'CANCELED' : 'SELESAI';

        if (!isCanceled) {
            totalSales += order.total;
        }
        
        html += `
            <div class="history-item" style="border-left-color: ${statusColor}">
                <div class="history-item-header">
                    <span class="history-item-name">${order.name} <small style="color: ${statusColor}; margin-left: 8px;">[${statusText}]</small></span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="history-item-time">${isCanceled ? 'Batal' : 'Selesai'}: ${order.timestamp}</span>
                        <button class="remove-btn" onclick="deleteCompletedOrder(${order.id})" title="Hapus riwayat" style="font-size: 22px; line-height: 1; padding: 0;">&times;</button>
                    </div>
                </div>
                <div class="history-item-products">${itemsList}</div>
                <div class="history-item-total">Total: Rp ${order.total.toLocaleString('id-ID')}</div>
            </div>
        `;
    });

    html += `
        <div class="total-sales-summary" style="position: sticky; bottom: 0; margin-top: 20px; padding: 15px; background: #f1f8f4; border-radius: 8px; border: 2px solid #27AE60; text-align: right; box-shadow: 0 -5px 15px rgba(0,0,0,0.1); z-index: 10;">
            <h3 style="margin: 0; color: #333; font-size: 16px;">Total Penjualan Berhasil:</h3>
            <div style="font-size: 24px; font-weight: bold; color: #27AE60; margin-top: 5px;">Rp ${totalSales.toLocaleString('id-ID')}</div>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">*Menghitung semua pesanan dengan status SELESAI</p>
        </div>
    `;

    completedList.innerHTML = html;
}

function finishOrder(orderId) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        let completedOrder = orders.splice(orderIndex, 1)[0];
        completedOrder.status = 'Selesai';
        completedOrder.timestamp = new Date().toISOString(); 
        
        completedOrders.push(completedOrder);

        const opEntry = {
            id: Date.now() + 1,
            type: 'pemasukan',
            desc: `Penjualan: ${completedOrder.name}`,
            amount: completedOrder.total,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().getTime()
        };
        
        opTransactions.push(opEntry);

        saveAllData(); 

        displayOpHistory();
        displayHistory();
        displayCompletedOrders();
        showNotification('Pesanan berhasil diselesaikan!');
    }
}

function editOrder(orderId) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        if (cart.length > 0 && !confirm('Keranjang kamu saat ini akan dikosongkan untuk mengedit pesanan ini. Lanjut?')) {
            return;
        }

        const orderToEdit = orders.splice(orderIndex, 1)[0];
        cart = [...orderToEdit.items];

        // Kembalikan nama dan tanggal ke form agar tidak perlu isi ulang
        const nameInput = document.getElementById('customer-name');
        const dateInput = document.getElementById('order-date');
        if (nameInput) nameInput.value = orderToEdit.name;
        if (dateInput) dateInput.value = orderToEdit.orderDate;
        
        saveAllData();
        renderAllUI();
        
        // Pindah ke tab keranjang
        const cartTab = document.querySelector('[data-tab="cart"]');
        if (cartTab) cartTab.click();

        showNotification('Pesanan dikembalikan ke keranjang untuk diedit', 'info');
    }
}

function cancelOrder(orderId) {
    if (confirm('Yakin ingin membatalkan pesanan ini?')) {
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex !== -1) {
            orders.splice(orderIndex, 1);
            saveAllData();
            displayHistory();
            showNotification('Pesanan berhasil dihapus', 'error');
        }
    }
}

function deleteCompletedOrder(orderId) {
    if (confirm('Yakin ingin menghapus riwayat pesanan ini dari daftar selesai?')) {
        const index = completedOrders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            completedOrders.splice(index, 1);
            saveAllData();
            displayCompletedOrders();
            showNotification('Riwayat pesanan berhasil dihapus', 'error');
        }
    }
}

// Windows/Global scope exposure agar onclick HTML tetap berfungsi
window.clearCompletedHistory = function() {
    if (confirm('Hapus semua riwayat pesanan selesai?')) {
        completedOrders = [];
        saveAllData();
        displayCompletedOrders();
        showNotification('Riwayat selesai dibersihkan');
    }
}

window.clearHistory = function() {
    if (confirm('Yakin ingin menghapus semua riwayat penjualan?')) {
        orders = [];
        saveAllData();
        displayHistory();
        showNotification('Riwayat penjualan telah dihapus');
    }
}

window.clearOpHistory = function() {
    if (confirm('Hapus semua catatan operasional?')) {
        opTransactions = [];
        saveAllData();
        displayOpHistory();
        showNotification('Riwayat operasional dibersihkan');
    }
}

// Pastikan fungsi ini terdaftar secara global segera agar bisa dipanggil onclick
function downloadPDF() {
    if (typeof html2pdf === 'undefined') {
        showNotification('Library PDF belum siap. Pastikan kamu terhubung internet.', 'error');
        return;
    }

    // Kita ambil area konten saja, bukan containernya agar lebih stabil
    const element = document.querySelector('#operational-container');
    const historyList = document.getElementById('op-history-list');
    const summaryBox = document.querySelector('.total-sales-summary');

    if (!element) return;

    // Format tanggal yang aman untuk nama file (Contoh: 2026-05-17)
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
    
    // Konfigurasi file PDF
    const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Laporan_Ops_Cimol_${dateStr}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true,
            logging: false,
            scrollY: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Sembunyikan elemen UI yang mengganggu capture
    const form = document.getElementById('operational-form');
    const btnDownload = document.querySelector('.btn-print-pdf');
    const btnClear = document.querySelector('.btn-clear-history');
    const nav = document.getElementById('floating-navbar');
    const stickySummary = document.querySelector('.op-summary-sticky');
    
    let originalHistoryListMaxHeight = '';
    let originalHistoryListOverflowY = '';

    // Matikan posisi sticky sementara karena html2pdf sering error dengan elemen sticky
    if (stickySummary) stickySummary.style.position = 'static';
    [form, btnDownload, btnClear, nav].forEach(el => { if(el) el.style.setProperty('display', 'none', 'important'); });

    showNotification('Sedang memproses PDF...', 'info');

    // Temporarily remove max-height and overflow-y from historyList to capture all content
    if (historyList) {
        originalHistoryListMaxHeight = historyList.style.maxHeight;
        originalHistoryListOverflowY = historyList.style.overflowY;
        historyList.style.maxHeight = 'none';
        historyList.style.overflowY = 'visible';
    }
    // Jalankan dengan sedikit delay agar browser sempat merender ulang setelah elemen disembunyikan
    setTimeout(() => {
        html2pdf().set(opt).from(element).save()
            .then(() => {
                showNotification('Laporan berhasil diunduh!');
            })
            .catch(err => {
                console.error('PDF Error:', err);
                showNotification('Gagal membuat PDF.', 'error');
            })
            .finally(() => {
                // Kembalikan tampilan semula
                if (stickySummary) stickySummary.style.position = '';
                [form, btnDownload, btnClear, nav].forEach(el => { if(el) el.style.display = ''; });
                if (historyList) {
                    historyList.style.maxHeight = originalHistoryListMaxHeight;
                    historyList.style.overflowY = originalHistoryListOverflowY;
                }
            });
    }, 500);
}
window.downloadPDF = downloadPDF;

window.addToCart = addToCart;
window.decreaseQty = decreaseQty;
window.increaseQty = increaseQty;
window.removeFromCart = removeFromCart;
window.editOrder = editOrder;
window.deleteCompletedOrder = deleteCompletedOrder;
window.updateNote = updateNote;
window.clearCart = clearCart;
window.navigateToMenu = navigateToMenu;
window.navigateToOperational = navigateToOperational;
window.logoutUser = logoutUser;
window.currentSlide = currentSlide;
window.changeSlide = changeSlide;
window.scrollToMenuItem = scrollToMenuItem;
window.scrollToCart = scrollToCart;

// --- OPERATIONAL MANAGEMENT ---
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
        saveAllData();
        
        this.reset();
        const opDateInput = document.getElementById('op-date');
        if (opDateInput) opDateInput.value = new Date().toISOString().split('T')[0];
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
        if (summary) summary.innerHTML = '';
        return;
    }

    let html = '';
    let totalIn = 0;
    let totalOut = 0;

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

    if (summary) {
        summary.innerHTML = `
            <div class="total-sales-summary op-summary-sticky" style="margin: 30px auto 100px auto; width: 90%; max-width: 600px; padding: 25px; background: #f1f8f4; border-radius: 15px; border: 2px solid #27AE60; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <h3 style="text-align: center; margin-bottom: 20px; color: #2C3E50; font-size: 18px;">Rekapitulasi Saldo Ops</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px;">
                    <span>Total Pemasukan:</span>
                    <span style="color: #27AE60; font-weight: bold;">Rp ${totalIn.toLocaleString('id-ID')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px;">
                    <span>Total Pengeluaran:</span>
                    <span style="color: #E63946; font-weight: bold;">Rp ${totalOut.toLocaleString('id-ID')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 2px dashed #27AE60; padding-top: 15px; font-size: 18px; font-weight: bold;">
                    <span>Saldo Netto:</span>
                    <span style="color: #2C3E50;">Rp ${(totalIn - totalOut).toLocaleString('id-ID')}</span>
                </div>
                <button onclick="downloadPDF()" class="btn-print-pdf" style="width: 100%; margin-top: 25px; padding: 14px; background: #2C3E50; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: background 0.3s;">
                    <svg style="width: 20px; fill: white;" viewBox="0 0 24 24">
                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                    </svg>
                    Download Laporan (PDF)
                </button>
            </div>
        `;
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

// Notification Function
function showNotification(message, type = 'success') {
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);