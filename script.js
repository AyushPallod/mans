document.addEventListener('DOMContentLoaded', () => {
    // Common elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- Login/Register Page Logic (index.html) ---
    if (loginForm) {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'dashboard.html'; // Redirect if already logged in
        }

        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.parentElement.style.display = 'none';
            registerForm.parentElement.style.display = 'block';
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.parentElement.style.display = 'none';
            loginForm.parentElement.style.display = 'block';
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
            const user = registeredUsers.find(u => u.email === email && u.password === password);

            if (user) {
                alert('Login successful!');
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('loggedInUserEmail', email);
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid email or password.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const number = document.getElementById('registerNumber').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

            // Check if email already exists
            if (registeredUsers.some(u => u.email === email)) {
                alert('An account with this email already exists. Please login or use a different email.');
                return;
            }

            const newUser = { name, number, email, password };
            registeredUsers.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

            alert('Registration successful! You can now log in.');
            registerForm.parentElement.style.display = 'none';
            loginForm.parentElement.style.display = 'block';
            registerForm.reset();
        });
    }

    // --- Global Logout Logic ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('loggedInUserEmail');
            sessionStorage.removeItem('cart'); // Clear cart on logout
            window.location.href = 'index.html';
        });
    }

    // --- Protect pages requiring login ---
    const protectedPages = ['dashboard.html', 'new_order.html', 'cart.html', 'current_orders.html', 'past_orders.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage) && sessionStorage.getItem('isLoggedIn') !== 'true') {
        alert('You must be logged in to view this page.');
        window.location.href = 'index.html';
    }

    // --- New Order Page Logic (new_order.html) ---
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    if (addToCartButtons.length > 0) {
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                const productName = e.target.dataset.name;
                const productPrice = parseFloat(e.target.dataset.price);
                const productSize = e.target.dataset.size;
                const quantity = parseInt(e.target.previousElementSibling.value);

                let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

                const existingItemIndex = cart.findIndex(item => item.id === productId);

                if (existingItemIndex > -1) {
                    cart[existingItemIndex].quantity += quantity;
                } else {
                    cart.push({
                        id: productId,
                        name: productName,
                        price: productPrice,
                        size: productSize,
                        quantity: quantity
                    });
                }
                sessionStorage.setItem('cart', JSON.stringify(cart));
                alert(`${quantity} x ${productName} added to cart!`);
            });
        });
    }

    // --- Cart Page Logic (cart.html) ---
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalItemsSpan = document.getElementById('cart-total-items');
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const placeOrderBtn = document.getElementById('place-order-btn');

    function renderCart() {
        const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        cartItemsContainer.innerHTML = '';
        let totalItems = 0;
        let totalPrice = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            placeOrderBtn.disabled = true;
        } else {
            placeOrderBtn.disabled = false;
            cart.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('cart-item');
                itemDiv.innerHTML = `
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p>Size: ${item.size}</p>
                        <p>Price: $${item.price.toFixed(2)} x ${item.quantity}</p>
                        <p>Subtotal: $${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <button class="remove-from-cart-btn" data-id="${item.id}">Remove</button>
                `;
                cartItemsContainer.appendChild(itemDiv);

                totalItems += item.quantity;
                totalPrice += item.price * item.quantity;
            });
        }

        cartTotalItemsSpan.textContent = totalItems;
        cartTotalPriceSpan.textContent = totalPrice.toFixed(2);

        document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                let cart = JSON.parse(sessionStorage.getItem('cart'));
                cart = cart.filter(item => item.id !== productId);
                sessionStorage.setItem('cart', JSON.stringify(cart));
                renderCart();
            });
        });
    }

    if (cartItemsContainer) {
        renderCart();

        placeOrderBtn.addEventListener('click', () => {
            const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                alert('Your cart is empty. Please add items before placing an order.');
                return;
            }

            let currentOrders = JSON.parse(sessionStorage.getItem('currentOrders')) || [];
            const newOrder = {
                id: `ORD-${Date.now()}`, // Simple unique ID
                date: new Date().toLocaleString(),
                items: cart,
                totalItems: parseInt(cartTotalItemsSpan.textContent),
                totalPrice: parseFloat(cartTotalPriceSpan.textContent),
                status: 'Pending'
            };

            currentOrders.push(newOrder);
            sessionStorage.setItem('currentOrders', JSON.stringify(currentOrders));
            sessionStorage.removeItem('cart'); // Clear cart after placing order
            alert('Order placed successfully! Check your current orders.');
            window.location.href = 'current_orders.html';
        });
    }

    // --- Current Orders Page Logic (current_orders.html) ---
    const currentOrdersList = document.getElementById('current-orders-list');
    const noCurrentOrdersMessage = document.getElementById('no-current-orders');

    function renderCurrentOrders() {
        const currentOrders = JSON.parse(sessionStorage.getItem('currentOrders')) || [];
        currentOrdersList.innerHTML = '';

        if (currentOrders.length === 0) {
            noCurrentOrdersMessage.style.display = 'block';
        } else {
            noCurrentOrdersMessage.style.display = 'none';
            currentOrders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.classList.add('order-item');
                orderDiv.innerHTML = `
                    <h3>Order ID: ${order.id}</h3>
                    <p><strong>Date:</strong> ${order.date}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Total Items:</strong> ${order.totalItems}</p>
                    <p><strong>Total Price:</strong> $${order.totalPrice.toFixed(2)}</p>
                    <h4>Items:</h4>
                    <ul>
                        ${order.items.map(item => `<li>${item.name} (Size: ${item.size}) - ${item.quantity} x $${item.price.toFixed(2)}</li>`).join('')}
                    </ul>
                    <button class="mark-received-btn" data-id="${order.id}">Mark as Received</button>
                `;
                currentOrdersList.appendChild(orderDiv);
            });
        }

        document.querySelectorAll('.mark-received-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderIdToMove = e.target.dataset.id;
                let currentOrders = JSON.parse(sessionStorage.getItem('currentOrders'));
                let pastOrders = JSON.parse(sessionStorage.getItem('pastOrders')) || [];

                const orderIndex = currentOrders.findIndex(order => order.id === orderIdToMove);

                if (orderIndex > -1) {
                    const receivedOrder = currentOrders.splice(orderIndex, 1)[0];
                    receivedOrder.status = 'Received';
                    receivedOrder.receivedDate = new Date().toLocaleString();
                    pastOrders.push(receivedOrder);

                    sessionStorage.setItem('currentOrders', JSON.stringify(currentOrders));
                    sessionStorage.setItem('pastOrders', JSON.stringify(pastOrders));
                    alert(`Order ${orderIdToMove} marked as received and moved to past orders.`);
                    renderCurrentOrders(); // Re-render current orders
                    // You might want to also re-render past orders if on that page, but for now it's a separate render function.
                }
            });
        });
    }

    if (currentOrdersList) {
        renderCurrentOrders();
    }

    // --- Past Orders Page Logic (past_orders.html) ---
    const pastOrdersList = document.getElementById('past-orders-list');
    const noPastOrdersMessage = document.getElementById('no-past-orders');

    function renderPastOrders() {
        const pastOrders = JSON.parse(sessionStorage.getItem('pastOrders')) || [];
        pastOrdersList.innerHTML = '';

        if (pastOrders.length === 0) {
            noPastOrdersMessage.style.display = 'block';
        } else {
            noPastOrdersMessage.style.display = 'none';
            pastOrders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.classList.add('order-item');
                orderDiv.innerHTML = `
                    <h3>Order ID: ${order.id}</h3>
                    <p><strong>Date Placed:</strong> ${order.date}</p>
                    <p><strong>Date Received:</strong> ${order.receivedDate || 'N/A'}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Total Items:</strong> ${order.totalItems}</p>
                    <p><strong>Total Price:</strong> $${order.totalPrice.toFixed(2)}</p>
                    <h4>Items:</h4>
                    <ul>
                        ${order.items.map(item => `<li>${item.name} (Size: ${item.size}) - ${item.quantity} x $${item.price.toFixed(2)}</li>`).join('')}
                    </ul>
                `;
                pastOrdersList.appendChild(orderDiv);
            });
        }
    }

    if (pastOrdersList) {
        renderPastOrders();
    }
});
