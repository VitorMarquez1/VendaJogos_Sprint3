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
    const summaryItems = document.getElementById('summary-items');
    const summaryTotal = document.getElementById('summary-total');
    const checkoutForm = document.getElementById('checkout-form');

    const cart = JSON.parse(localStorage.getItem('finalCart')) || [];
    const discount = parseFloat(localStorage.getItem('finalDiscount')) || 0;
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    if (cart.length === 0 || !user) {
        window.location.href = 'index.html';
        return;
    }

    function renderSummary() {
        summaryItems.innerHTML = '';
        cart.forEach(item => {
            summaryItems.innerHTML += `<p>${item.name} (x${item.quantity}) - R$ ${(item.price * item.quantity).toFixed(2)}</p>`;
        });

        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const total = subtotal * (1 - discount);
        summaryTotal.innerHTML = `<h3>Total a Pagar: R$ ${total.toFixed(2)}</h3>`;
    }

    async function updateStock() {
        const updatePromises = cart.map(item => {
            const newStock = item.stock - item.quantity;
            return fetch(`http://localhost:3000/products/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock })
            });
        });
        await Promise.all(updatePromises);
    }

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const total = subtotal * (1 - discount);

        const order = {
            userId: user.id, items: cart, subtotal, discount, total,
            date: new Date().toISOString()
        };

        try {
            const response = await fetch('http://localhost:3000/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });

            if (response.ok) {
                await updateStock();

                console.log(`--- SIMULAÇÃO DE ENVIO DE E-MAIL ---`);
                console.log(`De: GameStore <nao-responda@gamestore.com>`);
                console.log(`Para: ${user.email}`);
                console.log(`Assunto: Confirmação do seu Pedido #${new Date().getTime()}`);
                console.log(`\nOlá, ${user.name}!\n`);
                console.log(`Obrigado pela sua compra. Seu pedido foi confirmado e o resumo está abaixo:`);
                cart.forEach(item => { console.log(`- ${item.name} (x${item.quantity})`); });
                console.log(`\nTOTAL: R$ ${total.toFixed(2)}`);
                console.log(`\nAtenciosamente,\nEquipe GameStore`);
                console.log(`------------------------------------`);
                
                alert('Compra realizada com sucesso! Um e-mail de confirmação (fictício) foi registrado no console do navegador.');
                
                localStorage.removeItem('cart');
                localStorage.removeItem('finalCart');
                localStorage.removeItem('finalDiscount');

                window.location.href = 'perfil.html';
            } else {
                throw new Error('Não foi possível finalizar o pedido.');
            }
        } catch (error) {
            alert(error.message);
        }
    });

    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    const pixSection = document.getElementById('pix-section');
    const cardSection = document.getElementById('card-section');
    const installmentsGroup = document.getElementById('installments-group');

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const method = e.target.value;
            pixSection.style.display = (method === 'pix') ? 'block' : 'none';
            cardSection.style.display = (method !== 'pix') ? 'block' : 'none';
            installmentsGroup.style.display = (method === 'credit') ? 'block' : 'none';
        });
    });

    renderSummary();
});