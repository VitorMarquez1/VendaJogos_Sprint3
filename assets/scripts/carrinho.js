function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    if (user) {
        // Verifica se o usuário é admin para mostrar o link de cadastro
        const adminLink = user.admin ? '<a href="crud.html">Cadastro de Produtos</a>' : '';

        navLinks.innerHTML = `
            <a href="index.html">Home</a>
            ${adminLink}
            <a href="carrinho.html">Carrinho</a>
            <a href="perfil.html">Perfil</a>
            <a href="#" id="logout-btn">Sair</a>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    } else {
        navLinks.innerHTML = `
            <a href="index.html">Home</a>
            <a href="carrinho.html">Carrinho</a>
            <a href="login.html">Login</a>
            <a href="cadastro.html">Cadastro</a>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavLinks();
    const cartItemsContainer = document.getElementById('cart-items-container');
    const subtotalElement = document.getElementById('subtotal');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const couponInput = document.getElementById('coupon-input');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let discountPercentage = 0;

    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
            document.getElementById('cart-summary').style.display = 'none';
            return;
        }

        document.getElementById('cart-summary').style.display = 'block';

        cart.forEach((item, index) => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p>Preço: R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="btn-quantity" data-index="${index}" data-change="-1">-</button>
                    <input type="number" value="${item.quantity}" min="1" readonly>
                    <button class="btn-quantity" data-index="${index}" data-change="1">+</button>
                </div>
                <button class="btn-remove" data-index="${index}">Remover</button>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });

        addEventListeners();
        updateTotals();
    }

    function addEventListeners() {
        document.querySelectorAll('.btn-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const change = parseInt(e.target.dataset.change);
                updateQuantity(index, cart[index].quantity + change);
            });
        });

        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                removeFromCart(index);
            });
        });
    }

    function updateQuantity(index, newQuantity) {
        if (newQuantity > 0) {
            cart[index].quantity = newQuantity;
        } else {
            cart.splice(index, 1);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    function updateTotals() {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const total = subtotal * (1 - discountPercentage);
        
        subtotalElement.textContent = `Subtotal: R$ ${subtotal.toFixed(2)}`;
        totalPriceElement.textContent = `Total: R$ ${total.toFixed(2)}`;
        
        if (discountPercentage > 0) {
            totalPriceElement.innerHTML += ` <span style="font-size: 0.8rem; color: var(--success-color);">(${(discountPercentage * 100).toFixed(0)}% de desconto aplicado!)</span>`;
        }
    }
    
    function applyCoupon() {
        const couponCode = couponInput.value.trim().toUpperCase();
        if (couponCode === 'GAMER15') {
            discountPercentage = 0.15;
            alert('Cupom de 15% aplicado com sucesso!');
            couponInput.disabled = true;
            applyCouponBtn.disabled = true;
        } else {
            alert('Cupom inválido!');
            discountPercentage = 0;
        }
        updateTotals();
    }
    
    checkoutBtn.addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user) {
            alert('Você precisa estar logado para finalizar a compra!');
            window.location.href = 'login.html';
            return;
        }
        localStorage.setItem('finalCart', JSON.stringify(cart));
        localStorage.setItem('finalDiscount', discountPercentage);
        window.location.href = 'checkout.html';
    });
    
    applyCouponBtn.addEventListener('click', applyCoupon);

    renderCart();
});