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
    const productDetailsContainer = document.getElementById('product-details-container');
    const reviewsList = document.getElementById('reviews-list');
    const reviewForm = document.getElementById('review-form');
    
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        productDetailsContainer.innerHTML = '<p>Produto não encontrado.</p>';
        return;
    }

    async function fetchProductDetails() {
        try {
            const response = await fetch(`http://localhost:3000/products/${productId}`);
            if (!response.ok) throw new Error('Produto não encontrado.');
            const product = await response.json();
            document.title = product.name;
            displayProductDetails(product);
            displayReviews(product.reviews);
        } catch (error) {
            productDetailsContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    function displayProductDetails(product) {
        productDetailsContainer.innerHTML = `
            <div class="product-details">
                <div class="product-image-large">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h1>${product.name}</h1>
                    <p>${product.description}</p>
                    <p><strong>Plataforma:</strong> ${product.platform}</p>
                    <p><strong>Em estoque:</strong> ${product.stock}</p>
                    <p class="product-price">R$ ${product.price.toFixed(2)}</p>
                    <button id="addToCartBtn" class="btn">Adicionar ao Carrinho</button>
                    <button id="addToWishlistBtn" class="btn btn-secondary">Lista de Desejos</button>
                </div>
            </div>
        `;

        document.getElementById('addToCartBtn').addEventListener('click', () => addToCart(product));
        document.getElementById('addToWishlistBtn').addEventListener('click', () => addToWishlist(product));
    }

    function displayReviews(reviews) {
        reviewsList.innerHTML = '';
        if (reviews && reviews.length > 0) {
            reviews.forEach(review => {
                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'review';
                reviewDiv.innerHTML = `
                    <div class="review-header">
                        <span class="review-user">${review.user}</span>
                        <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <p>${review.comment}</p>
                `;
                reviewsList.appendChild(reviewDiv);
            });
        } else {
            reviewsList.innerHTML = '<p>Este produto ainda não tem avaliações.</p>';
        }
    }

    function addToCart(productToAdd) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === productToAdd.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...productToAdd, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`${productToAdd.name} foi adicionado ao carrinho!`);
    }

    function addToWishlist(productToAdd) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const existingItem = wishlist.find(item => item.id === productToAdd.id);

        if (!existingItem) {
            wishlist.push(productToAdd);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            alert(`${productToAdd.name} foi adicionado à sua lista de desejos!`);
        } else {
            alert('Este item já está na sua lista de desejos.');
        }
    }

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user) {
            alert('Você precisa estar logado para deixar uma avaliação.');
            return;
        }

        const rating = document.getElementById('rating').value;
        const comment = document.getElementById('comment').value;
        const newReview = { user: user.name, rating: parseInt(rating), comment: comment };

        try {
            const productResponse = await fetch(`http://localhost:3000/products/${productId}`);
            const product = await productResponse.json();
            product.reviews.push(newReview);

            const updateResponse = await fetch(`http://localhost:3000/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (updateResponse.ok) {
                alert('Avaliação enviada com sucesso!');
                reviewForm.reset();
                displayReviews(product.reviews);
            } else {
                throw new Error('Falha ao enviar avaliação.');
            }
        } catch (error) {
            alert(error.message);
        }
    });

    fetchProductDetails();
});