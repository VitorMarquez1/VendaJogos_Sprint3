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
    const userNameEl = document.getElementById('user-name');
    const orderHistoryContainer = document.getElementById('order-history-container');
    const wishlistContainer = document.getElementById('wishlist-container');

    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user) return;

    userNameEl.textContent = user.name;

    async function loadOrderHistory() {
        try {
            const response = await fetch(`http://localhost:3000/orders?userId=${user.id}`);
            const orders = await response.json();

            orderHistoryContainer.innerHTML = '';
            if (orders.length > 0) {
                orders.reverse().forEach(order => {
                    const orderDiv = document.createElement('div');
                    orderDiv.className = 'order';
                    
                    let itemsHtml = '';
                    order.items.forEach(item => {
                        const tokenHtml = item.category === 'jogo' && item.token
                            ? `<div class="order-detail">Chave de Ativação: <strong>${item.token}</strong></div>`
                            : '';
                        itemsHtml += `<div class="order-item">${item.name} (x${item.quantity})${tokenHtml}</div>`;
                    });

                    const shippingHtml = order.shippingCost > 0
                        ? `<div class="order-detail delivery-info">Entrega para o CEP ${order.cep} (Frete: R$ ${order.shippingCost.toFixed(2)} - Prazo: ${order.shippingTime})</div>`
                        : '';
                    
                    const discountHtml = order.discount > 0
                        ? `(Desconto: -R$ ${order.discount.toFixed(2)})`
                        : '';
                    
                    // NOVO: Formata a exibição da forma de pagamento
                    let paymentHtml = '';
                    if (order.paymentMethod) {
                        let paymentText = '';
                        switch (order.paymentMethod) {
                            case 'pix':
                                paymentText = 'Pix';
                                break;
                            case 'debit':
                                paymentText = 'Cartão de Débito';
                                break;
                            case 'credit':
                                if (order.installments > 1) {
                                    const installmentValue = order.total / order.installments;
                                    paymentText = `Cartão de Crédito em ${order.installments}x de R$ ${installmentValue.toFixed(2)}`;
                                } else {
                                    paymentText = 'Cartão de Crédito (1x)';
                                }
                                break;
                        }
                        paymentHtml = `<div class="order-detail payment-info">Pagamento: <strong>${paymentText}</strong></div>`;
                    }


                    orderDiv.innerHTML = `
                        <div class="order-header">
                            <span>Pedido de: ${new Date(order.date).toLocaleDateString()}</span>
                            <span>Total: R$ ${order.total.toFixed(2)} ${discountHtml}</span>
                        </div>
                        ${itemsHtml}
                        ${shippingHtml}
                        ${paymentHtml}
                    `;
                    orderHistoryContainer.appendChild(orderDiv);
                });
            } else {
                orderHistoryContainer.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
            }
        } catch (error) {
            console.error("Erro ao carregar histórico de pedidos:", error);
            orderHistoryContainer.innerHTML = '<p>Erro ao carregar histórico.</p>';
        }
    }
    
    function renderWishlist() {
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        wishlistContainer.innerHTML = '';

        if (wishlist.length > 0) {
            wishlist.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-card-body">
                        <h3>${product.name}</h3>
                        <div class="wishlist-buttons">
                            <a href="pagedetails.html?id=${product.id}" class="btn">Ver Produto</a>
                            <button class="btn btn-remove-wishlist" data-product-id="${product.id}">Remover</button>
                        </div>
                    </div>
                `;
                wishlistContainer.appendChild(productCard);
            });
        } else {
            wishlistContainer.innerHTML = '<p>Sua lista de desejos está vazia.</p>';
        }
    }
    
    function removeFromWishlist(productIdToRemove) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const updatedWishlist = wishlist.filter(item => item.id.toString() !== productIdToRemove);
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        renderWishlist();
    }

    wishlistContainer.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-remove-wishlist')) {
            const productId = e.target.dataset.productId;
            removeFromWishlist(productId);
        }
    });
    
    loadOrderHistory();
    renderWishlist();
});