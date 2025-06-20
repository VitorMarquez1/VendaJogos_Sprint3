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
            window.location.reload();
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
    const productCatalog = document.getElementById('product-catalog');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const genreFilter = document.getElementById('genreFilter');
    const typeFilter = document.getElementById('typeFilter');

    let allProducts = [];

    function populateFilters(products) {
        const genres = [...new Set(products.filter(p => p.category === 'jogo' && p.genre).map(p => p.genre))];
        const types = [...new Set(products.filter(p => p.category === 'acessorio' && p.type).map(p => p.type))];
        
        genreFilter.innerHTML = '<option value="all">Todos os Gêneros</option>';
        genres.sort().forEach(genre => {
            genreFilter.innerHTML += `<option value="${genre}">${genre}</option>`;
        });

        typeFilter.innerHTML = '<option value="all">Todos os Tipos</option>';
        types.sort().forEach(type => {
            typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
        });
    }

    async function fetchProducts() {
        try {
            const response = await fetch('http://localhost:3000/products');
            if (!response.ok) throw new Error('Não foi possível carregar os produtos.');
            allProducts = await response.json();
            displayProducts(allProducts);
            populateFilters(allProducts);
        } catch (error) {
            productCatalog.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    function displayProducts(products) {
        productCatalog.innerHTML = '';
        if (products.length === 0) {
            productCatalog.innerHTML = '<p>Nenhum produto encontrado com os filtros selecionados.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="product-card-body">
                    <div>
                        <h3>${product.name}</h3>
                        <p class="product-price">R$ ${product.price.toFixed(2)}</p>
                    </div>
                    <a href="pagedetails.html?id=${product.id}" class="btn">Ver Detalhes</a>
                </div>
            `;
            productCatalog.appendChild(productCard);
        });
    }

    function applyAllFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedGenre = genreFilter.value;
        const selectedType = typeFilter.value;

        let filteredProducts = allProducts;

        if (selectedCategory !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
        }

        if (selectedCategory === 'jogo' && selectedGenre !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.genre === selectedGenre);
        }
        
        if (selectedCategory === 'acessorio' && selectedType !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.type === selectedType);
        }

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
        }
        
        displayProducts(filteredProducts);
    }
    
    categoryFilter.addEventListener('change', () => {
        if (categoryFilter.value === 'jogo') {
            genreFilter.style.display = 'inline-block';
            typeFilter.style.display = 'none';
        } else if (categoryFilter.value === 'acessorio') {
            genreFilter.style.display = 'none';
            typeFilter.style.display = 'inline-block';
        } else {
            genreFilter.style.display = 'none';
            typeFilter.style.display = 'none';
        }
        // Reseta os filtros específicos ao mudar a categoria principal
        genreFilter.value = 'all';
        typeFilter.value = 'all';
        applyAllFilters();
    });

    searchInput.addEventListener('input', applyAllFilters);
    genreFilter.addEventListener('change', applyAllFilters);
    typeFilter.addEventListener('change', applyAllFilters);

    fetchProducts();
});