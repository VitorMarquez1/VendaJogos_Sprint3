function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (user) {
        navLinks.innerHTML = `
            <a href="index.html">Home</a>
            <a href="carrinho.html">Carrinho</a>
            <a href="perfil.html">Perfil</a>
            <a href="#" id="logout-btn">Sair</a>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    } else {
        window.location.href = 'login.html'; 
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
                        itemsHtml += `<div class="order-item">${item.name} (x${item.quantity})</div>`;
                    });
                    orderDiv.innerHTML = `
                        <div class="order-header">
                            <span>Pedido de: ${new Date(order.date).toLocaleDateString()}</span>
                            <span>Total: R$ ${order.total.toFixed(2)}</span>
                        </div>
                        ${itemsHtml}
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

    // --- FUNÇÃO CORRIGIDA ---
    function removeFromWishlist(productIdToRemove) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        // A correção está aqui: usamos '!=' em vez de '!==' para uma comparação mais flexível
        // ou convertemos ambos para o mesmo tipo. A abordagem mais segura é a segunda.
        // Vamos garantir que ambos os lados da comparação sejam do mesmo tipo (string).
        const updatedWishlist = wishlist.filter(item => item.id.toString() !== productIdToRemove);
        
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        
        // Re-renderiza a lista para mostrar a remoção imediatamente
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