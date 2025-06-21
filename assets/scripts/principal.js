function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (user) {
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
    const searchInput = document.getElementById('searchInput'); // Referência ao campo de busca
    const categoryFilter = document.getElementById('categoryFilter');
    const genreFilter = document.getElementById('genreFilter');
    const platformFilter = document.getElementById('platformFilter');
    const typeFilter = document.getElementById('typeFilter');

    const genreFilterGroup = document.getElementById('genre-filter-group');
    const platformFilterGroup = document.getElementById('platform-filter-group');
    const typeFilterGroup = document.getElementById('type-filter-group');

    let allProducts = [];

    function renderCarousel(products) {
        const featuredProducts = products.filter(p => p.featured);
        const carouselInner = document.getElementById('carousel-inner');
        const carouselIndicators = document.getElementById('carousel-indicators');
        const featuredSection = document.getElementById('featured-section');

        if (!carouselInner || featuredProducts.length === 0) {
            if (featuredSection) featuredSection.style.display = 'none';
            return;
        }

        carouselInner.innerHTML = '';
        carouselIndicators.innerHTML = '';

        featuredProducts.forEach((product, index) => {
            const activeClass = index === 0 ? 'active' : '';
            carouselIndicators.innerHTML += `<button type="button" data-bs-target="#featured-carousel" data-bs-slide-to="${index}" class="${activeClass}" aria-current="true"></button>`;
            carouselInner.innerHTML += `
                <div class="carousel-item ${activeClass}">
                    <a href="pagedetails.html?id=${product.id}">
                        <img src="${product.image}" class="d-block w-100" alt="${product.name}">
                        <div class="carousel-caption d-none d-md-block">
                            <h5>${product.name}</h5>
                            <p>${product.description.substring(0, 100)}...</p>
                        </div>
                    </a>
                </div>`;
        });
    }

    function populateFilters(products) {
        const genres = new Set();
        const platforms = new Set();
        const types = new Set();

        products.forEach(p => {
            if (p.category === 'jogo') {
                if(p.genre) genres.add(p.genre);
                if(p.platform) p.platform.split(' / ').forEach(plat => platforms.add(plat.trim()));
            } else if (p.category === 'acessorio') {
                if(p.type) types.add(p.type);
            }
        });

        genreFilter.innerHTML = '<option value="all">Todos os Gêneros</option>';
        platformFilter.innerHTML = '<option value="all">Todas as Plataformas</option>';
        typeFilter.innerHTML = '<option value="all">Todos os Tipos</option>';

        genres.forEach(g => genreFilter.innerHTML += `<option value="${g}">${g}</option>`);
        platforms.forEach(p => platformFilter.innerHTML += `<option value="${p}">${p}</option>`);
        types.forEach(t => typeFilter.innerHTML += `<option value="${t}">${t}</option>`);
    }

    async function fetchProducts() {
        try {
            const response = await fetch('http://localhost:3000/products');
            if (!response.ok) throw new Error('Não foi possível carregar os produtos.');
            allProducts = await response.json();
            
            renderCarousel(allProducts);
            populateFilters(allProducts);
            handleFilterVisibility();
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            productCatalog.innerHTML = `<p style="color: red;">Erro ao carregar o catálogo.</p>`;
        }
    }

    function displayProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedGenre = genreFilter.value;
        const selectedPlatform = platformFilter.value;
        const selectedType = typeFilter.value;

        const filteredProducts = allProducts.filter(p => {
            // Filtro de busca por nome (aplicado a todos)
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Filtro de Categoria
            if (selectedCategory !== 'all' && p.category !== selectedCategory) {
                return false;
            }

            // Filtros específicos para JOGOS
            if (p.category === 'jogo') {
                const genreMatch = selectedGenre === 'all' || p.genre === selectedGenre;
                const platformMatch = selectedPlatform === 'all' || (p.platform && p.platform.includes(selectedPlatform));
                if (!genreMatch || !platformMatch) return false;
            }
            
            // Filtros específicos para ACESSÓRIOS
            if (p.category === 'acessorio') {
                const typeMatch = selectedType === 'all' || p.type === selectedType;
                if (!typeMatch) return false;
            }

            return true;
        });

        productCatalog.innerHTML = '';
        if (filteredProducts.length === 0) {
            productCatalog.innerHTML = '<p>Nenhum produto encontrado com os filtros selecionados.</p>';
            return;
        }

        filteredProducts.forEach(product => {
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
                </div>`;
            productCatalog.appendChild(productCard);
        });
    }

    function handleFilterVisibility() {
        const selectedCategory = categoryFilter.value;
        
        genreFilterGroup.style.display = (selectedCategory === 'all' || selectedCategory === 'jogo') ? 'flex' : 'none';
        platformFilterGroup.style.display = (selectedCategory === 'all' || selectedCategory === 'jogo') ? 'flex' : 'none';
        typeFilterGroup.style.display = (selectedCategory === 'all' || selectedCategory === 'acessorio') ? 'flex' : 'none';

        if (selectedCategory === 'jogo') typeFilter.value = 'all';
        if (selectedCategory === 'acessorio') {
            genreFilter.value = 'all';
            platformFilter.value = 'all';
        }

        displayProducts();
    }
    
    // Adiciona os event listeners a todos os filtros
    searchInput.addEventListener('input', displayProducts);
    categoryFilter.addEventListener('change', handleFilterVisibility);
    genreFilter.addEventListener('change', displayProducts);
    platformFilter.addEventListener('change', displayProducts);
    typeFilter.addEventListener('change', displayProducts);

    fetchProducts();
});