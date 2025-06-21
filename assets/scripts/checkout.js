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

function generateGameKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
        if ((i + 1) % 4 === 0 && i < 15) {
            key += '-';
        }
    }
    return key;
}

function calculateShipping(cep) {
    const cepPrefix = cep.charAt(0);
    if (cepPrefix === '3') {
        return { cost: 15.50, time: '2-4 dias úteis' };
    }
    if (['0', '1', '2'].includes(cepPrefix)) {
        return { cost: 25.80, time: '4-6 dias úteis' };
    }
    if (['8', '9'].includes(cepPrefix)) {
        return { cost: 35.00, time: '5-8 dias úteis' };
    }
    if (['4', '5'].includes(cepPrefix)) {
        return { cost: 45.90, time: '7-12 dias úteis' };
    }
    return { cost: 55.00, time: '8-15 dias úteis' };
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavLinks();
    
    const summaryItems = document.getElementById('summary-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryShipping = document.getElementById('summary-shipping');
    const summaryTotal = document.getElementById('summary-total');
    const checkoutForm = document.getElementById('checkout-form');
    const shippingSection = document.getElementById('shipping-section');
    const cepInput = document.getElementById('cep-input');
    const calculateShippingBtn = document.getElementById('calculate-shipping-btn');
    const shippingResult = document.getElementById('shipping-result');
    const installmentsSelect = document.getElementById('installments');
    const installmentValueDisplay = document.getElementById('installment-value');

    const cart = JSON.parse(localStorage.getItem('finalCart')) || [];
    const discountPercentage = parseFloat(localStorage.getItem('finalDiscount')) || 0;
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    let shippingInfo = null;

    if (cart.length === 0 || !user) {
        window.location.href = 'index.html';
        return;
    }

    const hasAccessories = cart.some(item => item.category === 'acessorio');
    if (hasAccessories) {
        shippingSection.style.display = 'block';
        cepInput.required = true;
    } else {
        shippingSection.style.display = 'none';
        cepInput.required = false;
    }

    function updateOrderSummary() {
        summaryItems.innerHTML = '';
        cart.forEach(item => {
            summaryItems.innerHTML += `<p>${item.name} (x${item.quantity}) - R$ ${(item.price * item.quantity).toFixed(2)}</p>`;
        });

        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const discountValue = subtotal * discountPercentage;
        const shippingCost = shippingInfo ? shippingInfo.cost : 0;
        const total = subtotal - discountValue + shippingCost;

        summarySubtotal.innerHTML = `<p>Subtotal: R$ ${subtotal.toFixed(2)}</p>`;
        
        if (discountValue > 0) {
            summaryDiscount.innerHTML = `<p>Desconto (GAMER15): - R$ ${discountValue.toFixed(2)}</p>`;
        } else {
            summaryDiscount.innerHTML = '';
        }

        if (shippingInfo) {
            summaryShipping.innerHTML = `<p>Frete: R$ ${shippingCost.toFixed(2)}</p>`;
        } else {
            summaryShipping.innerHTML = '';
        }

        summaryTotal.innerHTML = `<h3>Total a Pagar: R$ ${total.toFixed(2)}</h3>`;
        
        updateInstallmentValue(total);
    }
    
    function updateInstallmentValue(total) {
        const installments = parseInt(installmentsSelect.value);
        if (installments > 1) {
            const valuePerInstallment = total / installments;
            installmentValueDisplay.textContent = `(${installments}x de R$ ${valuePerInstallment.toFixed(2)})`;
        } else {
            installmentValueDisplay.textContent = '';
        }
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

        if (hasAccessories && !shippingInfo) {
            alert('Por favor, calcule o frete para continuar.');
            return;
        }
        
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const discountValue = subtotal * discountPercentage;
        const total = subtotal - discountValue + (shippingInfo ? shippingInfo.cost : 0);
        
        const itemsWithTokens = cart.map(item => {
            if (item.category === 'jogo') {
                return { ...item, token: generateGameKey() };
            }
            return item;
        });
        
        // ALTERADO: Captura a forma de pagamento e as parcelas
        const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        const order = {
            userId: user.id,
            items: itemsWithTokens,
            subtotal: subtotal,
            discount: discountValue,
            shippingCost: shippingInfo ? shippingInfo.cost : 0,
            shippingTime: shippingInfo ? shippingInfo.time : null,
            cep: shippingInfo ? cepInput.value : null,
            total: total,
            date: new Date().toISOString(),
            // NOVO: Adiciona os detalhes de pagamento ao pedido
            paymentMethod: selectedPaymentMethod,
            installments: selectedPaymentMethod === 'credit' ? parseInt(installmentsSelect.value) : 1
        };

        try {
            const response = await fetch('http://localhost:3000/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });

            if (response.ok) {
                await updateStock();
                
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
    
    calculateShippingBtn.addEventListener('click', () => {
        const cep = cepInput.value.trim();
        if (/^\d{5}-?\d{3}$/.test(cep)) {
            shippingInfo = calculateShipping(cep.replace('-', ''));
            shippingResult.innerHTML = `<p style="color: var(--success-color);">Frete: R$ ${shippingInfo.cost.toFixed(2)} (Prazo: ${shippingInfo.time})</p>`;
            updateOrderSummary();
        } else {
            alert('CEP inválido. Use o formato 00000-000.');
            shippingInfo = null;
            shippingResult.innerHTML = '';
            updateOrderSummary();
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
    
    installmentsSelect.addEventListener('change', () => {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const discountValue = subtotal * discountPercentage;
        const total = subtotal - discountValue + (shippingInfo ? shippingInfo.cost : 0);
        updateInstallmentValue(total);
    });

    updateOrderSummary();
});