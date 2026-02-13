// Configuration
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQUcQ6YgTSk_09Skk_5ggNglMpjx9yroR-L1AGSnH-04D4qlOoEf7Ywda5xHO4SEjtGUV0EXGfZ-QnO/pub?gid=0&single=true&output=csv';
const WHATSAPP_NUMBER = '+8801673064324';
const STORAGE_KEY = 'nutsSpicesSelections';

// Global state
let products = [];
let filteredProducts = [];
let selections = {};

// DOM elements
const productsContainer = document.getElementById('productsContainer');
const totalAmountElement = document.getElementById('totalAmount');
const selectedItemsElement = document.getElementById('selectedItems');
const whatsappBtn = document.getElementById('whatsappBtn');
const resetBtn = document.getElementById('resetBtn');
const searchInput = document.getElementById('searchInput');

// Modal elements
const modal = document.getElementById('userDetailsModal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
const userDetailsForm = document.getElementById('userDetailsForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSelectionsFromStorage();
    fetchProducts();
    
    // Event listeners
    whatsappBtn.addEventListener('click', showModal);
    resetBtn.addEventListener('click', resetAllSelections);
    searchInput.addEventListener('input', filterProducts);
    
    // Modal event listeners
    closeModalBtn.addEventListener('click', hideModal);
    cancelModalBtn.addEventListener('click', hideModal);
    confirmOrderBtn.addEventListener('click', handleConfirmOrder);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideModal();
        }
    });
});

// Fetch products from CSV
async function fetchProducts() {
    try {
        const response = await fetch(CSV_URL);
        const csvData = await response.text();
        parseCSVData(csvData);
    } catch (error) {
        console.error('Error fetching CSV:', error);
        productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Products</h3>
                <p>We couldn't load the product list. Please check your connection and try again.</p>
            </div>
        `;
    }
}

// Parse CSV data
function parseCSVData(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Find the correct column indices
    const nameIndex = headers.findIndex(header => 
        header.toLowerCase().includes('product') || header.toLowerCase().includes('name')
    );
    
    const priceIndex = headers.findIndex(header => 
        header.toLowerCase().includes('price') || header.toLowerCase().includes('50gm')
    );
    
    // Clear loading state
    productsContainer.innerHTML = '';
    
    // If we can't find the columns, show error
    if (nameIndex === -1 || priceIndex === -1) {
        productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Data Format Error</h3>
                <p>The CSV data doesn't have the expected columns. Please check the source.</p>
            </div>
        `;
        return;
    }
    
    // Parse each line (skip header)
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const columns = lines[i].split(',').map(col => col.trim());
        const name = columns[nameIndex];
        let price = columns[priceIndex];
        
        // Clean up price (remove any non-numeric characters except decimal point)
        price = parseFloat(price.replace(/[^\d.]/g, ''));
        
        // Only add if we have both name and price
        if (name && !isNaN(price)) {
            products.push({
                id: i, // Use line number as ID
                name: name,
                price: price,
                quantity: selections[name] || 0
            });
        }
    }
    
    // If no products were parsed, show empty state
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Products Found</h3>
                <p>We couldn't find any products in the CSV data.</p>
            </div>
        `;
        return;
    }
    
    filteredProducts = [...products];
    renderProducts();
    updateSummary();
}

// Filter products based on search input
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts();
}

// Render all products
function renderProducts() {
    productsContainer.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Products Found</h3>
                <p>No nuts match your search. Try a different keyword.</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-header">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${product.price.toFixed(2)} BDT / 50gm</div>
            </div>
            <div class="product-body">
                <p class="measure-info">Each click adds 50gm</p>
                <div class="quantity-controls">
                    <button class="qty-btn minus-btn" data-id="${product.id}" ${product.quantity === 0 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <div class="qty-display" id="qty-${product.id}">${product.quantity}</div>
                    <button class="qty-btn plus-btn" data-id="${product.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="product-total" id="total-${product.id}">
                    ${(product.quantity * product.price).toFixed(2)} BDT
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            updateQuantity(productId, -1);
        });
    });
    
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            updateQuantity(productId, 1);
        });
    });
}

// Update product quantity
function updateQuantity(productId, change) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = Math.max(0, product.quantity + change);
    product.quantity = newQuantity;
    
    // Update UI for this product if it's in the filtered list
    const qtyElement = document.getElementById(`qty-${productId}`);
    const totalElement = document.getElementById(`total-${productId}`);
    
    if (qtyElement) {
        qtyElement.textContent = newQuantity;
        totalElement.textContent = `${(newQuantity * product.price).toFixed(2)} BDT`;
        
        // Enable/disable minus button
        const minusBtn = document.querySelector(`.minus-btn[data-id="${productId}"]`);
        if (minusBtn) {
            minusBtn.disabled = newQuantity === 0;
        }
    }
    
    // Update selections object
    selections[product.name] = newQuantity;
    
    // Save to storage and update summary
    saveSelectionsToStorage();
    updateSummary();
}

// Update order summary
function updateSummary() {
    let total = 0;
    let selectedItemsHTML = '';
    let hasSelectedItems = false;
    
    products.forEach(product => {
        if (product.quantity > 0) {
            hasSelectedItems = true;
            const productTotal = product.quantity * product.price;
            total += productTotal;
            
            selectedItemsHTML += `
                <div class="selected-item">
                    <span>${product.name} (${product.quantity} × 50gm)</span>
                    <span>${productTotal.toFixed(2)} BDT</span>
                </div>
            `;
        }
    });
    
    // Update total amount
    totalAmountElement.textContent = total.toFixed(2);
    
    // Update selected items list
    if (hasSelectedItems) {
        selectedItemsElement.innerHTML = selectedItemsHTML;
    } else {
        selectedItemsElement.innerHTML = `
            <div class="empty-state" style="padding: 10px; font-size: 0.9rem;">
                <i class="fas fa-shopping-basket"></i>
                <p>No items selected yet. Use the + buttons to add nuts to your order.</p>
            </div>
        `;
    }
}

// Save selections to localStorage
function saveSelectionsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// Load selections from localStorage
function loadSelectionsFromStorage() {
    try {
        const savedSelections = localStorage.getItem(STORAGE_KEY);
        if (savedSelections) {
            selections = JSON.parse(savedSelections);
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        selections = {};
    }
}

// Reset all selections
function resetAllSelections() {
    if (confirm('Are you sure you want to reset all selections?')) {
        selections = {};
        products.forEach(product => {
            product.quantity = 0;
        });
        
        // Clear localStorage
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Error clearing localStorage:', e);
        }
        
        // Re-render everything
        filteredProducts = [...products];
        renderProducts();
        updateSummary();
    }
}

// MODAL FUNCTIONS
function showModal() {
    // Check if there are items selected
    let hasItems = products.some(product => product.quantity > 0);
    if (!hasItems) {
        alert('Please select at least one item before sending the order.');
        return;
    }
    
    // Clear form fields
    userDetailsForm.reset();
    modal.style.display = 'block';
}

function hideModal() {
    modal.style.display = 'none';
}

// Handle confirm order (when user submits details)
function handleConfirmOrder() {
    // Get form values
    const name = document.getElementById('name').value.trim();
    const district = document.getElementById('district').value.trim();
    const thana = document.getElementById('thana').value.trim();
    const address = document.getElementById('address').value.trim();
    
    // Validate name (required)
    if (!name) {
        alert('Please enter your name.');
        return;
    }
    
    // Build the WhatsApp message
    sendToWhatsApp(name, district, thana, address);
    hideModal();
}

// Send order to WhatsApp with user details
function sendToWhatsApp(name, district, thana, address) {
    let message = `Name: ${name}\n`;
    
    if (district) {
        message += `District: ${district}\n`;
    }
    if (thana) {
        message += `Thana: ${thana}\n`;
    }
    if (address) {
        message += `Address: ${address}\n`;
    }
    
    message += `\n*Order from Nuts&SpicesBunker*\n\n`;
    let total = 0;
    let itemCount = 0;
    
    // Build the message with total grams instead of price for each item
    products.forEach(product => {
        if (product.quantity > 0) {
            itemCount++;
            const productTotal = product.quantity * product.price;
            total += productTotal;
            const totalGrams = product.quantity * 50;
            message += `• ${product.name}: ${product.quantity} × 50gm = ${totalGrams} gm\n`;
        }
    });
    
    message += `\n*Total: ${total.toFixed(2)} BDT*\n\n`;
    message += `_Order generated via ${name}_`;
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
}