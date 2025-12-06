        // DOM Elements
        const productsGrid = document.getElementById('products-grid');
        const productCount = document.getElementById('product-count');
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const filterModalBtn = document.getElementById('filter-modal-btn');
        const filterModal = document.getElementById('filter-modal');
        const applyFilter = document.getElementById('apply-filter');
        const resetFilter = document.getElementById('reset-filter');
        const productModal = document.getElementById('product-modal');
        const closeModal = document.getElementById('close-modal');
        const modalBody = document.getElementById('modal-body');
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        const loadingSpinner = document.getElementById('loading-spinner');
        const discountText = document.getElementById('discount-text');

        // Global products array
        let products = [];
        let filteredProducts = [];

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            // Fetch products from Google Sheets
            fetchProductsFromGoogleSheets();
            
            // Set up event listeners
            setupEventListeners();
        });

        // Set up all event listeners
        function setupEventListeners() {
            searchInput.addEventListener('input', filterProducts);
            searchBtn.addEventListener('click', filterProducts);

            filterModalBtn.addEventListener('click', () => {
                filterModal.style.display = 'flex';
            });

            applyFilter.addEventListener('click', filterProducts);
            resetFilter.addEventListener('click', resetFilters);

            closeModal.addEventListener('click', () => {
                productModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });

            window.addEventListener('click', (e) => {
                if (e.target === productModal) {
                    productModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
                if (e.target === filterModal) {
                    filterModal.style.display = 'none';
                }
            });
            
            // Close modal when pressing Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    productModal.style.display = 'none';
                    filterModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }

        // Function to update the discount banner with the highest discount
        function updateDiscountBanner() {
            // Find the product with the highest discount
            let highestDiscountProduct = null;
            let highestDiscount = 0;
            
            for (const product of products) {
                if (product.discountValue > highestDiscount) {
                    highestDiscount = product.discountValue;
                    highestDiscountProduct = product;
                }
            }
            
            // Update the banner text
            if (highestDiscountProduct) {
                discountText.textContent = `${highestDiscountProduct.name} - ${highestDiscountProduct.discount}`;
            } else {
                discountText.textContent = "Special Offers Available - Shop Now!";
            }
        }

        // Display products
        function displayProducts(productsArray) {
            productsGrid.innerHTML = '';
            productCount.textContent = productsArray.length;
            
            if (productsArray.length === 0) {
                productsGrid.innerHTML = '<p>No products found. Try adjusting your search filters.</p>';
                return;
            }
            
            productsArray.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    ${product.discountValue > 0 ? `<div class="discount-badge">${product.discount}</div>` : ''}
                    <div class="product-image-container">
                        <img src="${product.image}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">BDT ${product.price} <span class="price-unit">/kg</span> ${product.discountValue > 0 ? `<span class="product-discount">${product.discount}</span>` : ''}</div>
                    </div>
                `;
                
                productCard.addEventListener('click', () => {
                    showProductDetails(product);
                });
                
                productsGrid.appendChild(productCard);
            });
        }

        // Show product details in modal
        function showProductDetails(product) {
            modalBody.innerHTML = `
                <div class="product-detail">
                    <div>
                        <img src="${product.image}" alt="${product.name}" class="product-detail-image">
                    </div>
                    <div class="detail-info">
                        <h2>${product.name}</h2>
                        <div class="detail-price">BDT ${product.price} <span class="price-unit">/kg</span> ${product.discountValue > 0 ? `<span class="product-discount">${product.discount}</span>` : ''}</div>
                        
                        <div class="product-description">
                            <h3>Description</h3>
                            <p>${product.description}</p>
                        </div>
                        
                        <a href="https://wa.me/8801673064324?text=Hi, I'm interested in ${encodeURIComponent(product.name)} (Product ID: ${product.id})" 
                           class="whatsapp-chat" target="_blank">
                           <i class="fab fa-whatsapp"></i> Chat on WhatsApp
                        </a>
                    </div>
                </div>
            `;
            
            productModal.style.display = 'flex';
            
            // Prevent background scrolling when modal is open
            document.body.style.overflow = 'hidden';
        }

        // Filter products based on search and price range
        function filterProducts() {
            const searchText = searchInput.value.toLowerCase();
            const minPrice = minPriceInput.value ? parseInt(minPriceInput.value) : 0;
            const maxPrice = maxPriceInput.value ? parseInt(maxPriceInput.value) : Number.MAX_SAFE_INTEGER;
            
            filteredProducts = products.filter(product => {
                const matchesSearch = product.name.toLowerCase().includes(searchText);
                const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
                return matchesSearch && matchesPrice;
            });
            
            displayProducts(filteredProducts);
            filterModal.style.display = 'none';
            
            // Restore background scrolling
            document.body.style.overflow = 'auto';
        }

        // Reset filters and show all products
        function resetFilters() {
            searchInput.value = '';
            minPriceInput.value = '';
            maxPriceInput.value = '';
            filteredProducts = [...products];
            displayProducts(filteredProducts);
            filterModal.style.display = 'none';
        }

        // Function to fetch products from Google Sheets (CSV)
        async function fetchProductsFromGoogleSheets() {
            try {
                // Your published Google Sheets CSV URL
                const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFSBdfwj1yPXJZq5A6QoFU1Zh1uTzff6DuKXCyxrnSIDJwI_JIMtmMcFwipVaO_BKobCobkS-_nvag/pub?gid=0&single=true&output=csv';
                
                const response = await fetch(sheetUrl);
                const csvData = await response.text();
                
                // Parse CSV data
                products = parseCSVData(csvData);
                filteredProducts = [...products];
                
                // Update UI
                updateDiscountBanner();
                displayProducts(filteredProducts);
                
                // Hide loading spinner
                loadingSpinner.style.display = 'none';
            } catch (error) {
                console.error('Error fetching product data:', error);
                // Fallback to sample data if Google Sheets fails
                useSampleData();
            }
        }

        // Use sample data if Google Sheets is not available
        function useSampleData() {
            const sampleProducts = [
                {
                    id: 1,
                    name: "Premium Almonds",
                    price: 1200,
                    discount: "15% off",
                    discountValue: 15,
                    image: "https://images.unsplash.com/photo-1615485925505-2a5d0a5fd24c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    description: "Our premium almonds are carefully selected for their size, flavor, and nutritional value. Rich in vitamins, minerals, and healthy fats, these almonds are perfect for snacking or adding to your favorite recipes."
                },
                {
                    id: 2,
                    name: "Organic Cashew Nuts",
                    price: 1400,
                    discount: "10% off",
                    discountValue: 10,
                    image: "https://images.unsplash.com/photo-1554679663-49c2955a2111?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    description: "These organic cashew nuts are creamy, buttery, and packed with nutrients. Grown without pesticides, they're a healthy and delicious snack that's rich in copper, magnesium, and zinc."
                },
                {
                    id: 3,
                    name: "Walnut Halves",
                    price: 1100,
                    discount: "5% off",
                    discountValue: 5,
                    image: "https://images.unsplash.com/photo-1592415486684-3f85ce7b6e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    description: "Our walnut halves are fresh, crunchy, and full of flavor. Rich in omega-3 fatty acids and antioxidants, these walnuts are perfect for baking, cooking, or enjoying as a healthy snack."
                },
                {
                    id: 4,
                    name: "Premium Turmeric Powder",
                    price: 800,
                    discount: "20% off",
                    discountValue: 20,
                    image: "https://images.unsplash.com/photo-1590502509897-5d5dac2dcc61?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    description: "Our premium turmeric powder is made from the finest turmeric roots, carefully dried and ground to preserve its vibrant color and potent health benefits. Add this golden spice to your dishes for both flavor and wellness."
                },
                {
                    id: 5,
                    name: "Cinnamon Sticks",
                    price: 900,
                    discount: "12% off",
                    discountValue: 12,
                    image: "https://images.unsplash.com/photo-1593620659530-7f33ba5d5a64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    description: "These fragrant cinnamon sticks are sourced from the highest quality cinnamon trees. Perfect for adding warm, sweet flavor to both sweet and savory dishes, as well as beverages like tea and coffee."
                },
                {
                    id: 6,
                    name: "Mixed Nuts Gift Pack",
                    price: 2500,
                    discount: "18% off",
                    discountValue: 18,
                    image: "https://images.unsplash.com/photo-1540293744254-4cfc44c22f5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    description: "This premium mixed nuts gift pack contains a selection of our finest almonds, cashews, walnuts, and pistachios. Beautifully packaged, it makes the perfect gift for any occasion."
                }
            ];
            
            products = sampleProducts;
            filteredProducts = [...products];
            
            updateDiscountBanner();
            displayProducts(filteredProducts);
            loadingSpinner.style.display = 'none';
            
            console.log("Using sample data as Google Sheets is not accessible");
        }

        // Parse CSV data into product objects - FIXED VERSION
        function parseCSVData(csvData) {
            const products = [];
            const rows = csvData.split('\n');
            
            // Skip header row and process each row
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.trim() === '') continue;
                
                // Handle CSV with quotes and commas inside values
                const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                
                // Extract discount value from discount string (e.g., "10% off" -> 10)
                const discountString = columns[3] ? columns[3].replace(/"/g, '') : '0% off';
                const discountValue = parseInt(discountString) || 0;
                
                // Create product object
                const product = {
                    id: columns[0] ? parseInt(columns[0].replace(/"/g, '')) : i,
                    name: columns[1] ? columns[1].replace(/"/g, '') : 'Unnamed Product',
                    price: columns[2] ? parseInt(columns[2].replace(/"/g, '')) : 0,
                    discount: discountString,
                    discountValue: discountValue,
                    image: columns[4] ? columns[4].replace(/"/g, '') : 'https://images.unsplash.com/photo-1615485925505-2a5d0a5fd24c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                    description: columns[5] ? columns[5].replace(/"/g, '') : 'No description available.'
                };
                
                products.push(product);
            }
            
            return products;
        }