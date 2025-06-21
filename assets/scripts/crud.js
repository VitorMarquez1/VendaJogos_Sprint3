function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    if (user) {
        const adminLink = user.admin ? '<a href="crud.html">Cadastro de Produtos</a>' : '';
        navLinks.innerHTML = `<a href="index.html">Home</a>${adminLink}<a href="carrinho.html">Carrinho</a><a href="perfil.html">Perfil</a><a href="#" id="logout-btn">Sair</a>`;
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

    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user || !user.admin) {
        alert('Acesso negado. Esta página é restrita a administradores.');
        window.location.href = 'index.html';
        return;
    }

    const productListContainer = document.getElementById('product-list-container');
    const form = document.getElementById('crud-form');
    const categorySelect = document.getElementById('category');
    
    // Adicionado 'featured' aos campos do formulário
    const fields = ['productId', 'name', 'price', 'description', 'image', 'stock', 'category', 'genre', 'type', 'platform', 'featured'];
    const formElements = fields.reduce((acc, field) => {
        acc[field] = document.getElementById(field);
        return acc;
    }, {});

    const btnInsert = document.getElementById('btn-insert');
    const btnUpdate = document.getElementById('btn-update');
    const btnDelete = document.getElementById('btn-delete');
    const btnClear = document.getElementById('btn-clear');

    const API_URL = 'http://localhost:3000/products';

    async function fetchAndDisplayProducts() {
        try {
            const response = await fetch(API_URL);
            const products = await response.json();
            
            productListContainer.innerHTML = '<table><thead><tr><th>Nome</th><th>Destaque</th><th>Ação</th></tr></thead><tbody>' +
                products.map(p => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.featured ? 'Sim' : 'Não'}</td>
                        <td><button class="btn btn-select" data-id="${p.id}">Selecionar</button></td>
                    </tr>
                `).join('') + '</tbody></table>';
            
            document.querySelectorAll('.btn-select').forEach(button => {
                button.addEventListener('click', () => {
                    const product = products.find(p => p.id == button.dataset.id);
                    loadProductIntoForm(product);
                });
            });
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        }
    }

    function loadProductIntoForm(product) {
        for (const field in formElements) {
            const productKey = field === 'productId' ? 'id' : field;
            // Lógica para campos de texto/número e para o checkbox
            if (formElements[field].type === 'checkbox') {
                formElements[field].checked = product[productKey] || false;
            } else {
                formElements[field].value = product[productKey] || '';
            }
        }
        toggleCategoryFields();
    }
    
    function getFormData() {
         return {
            id: formElements.productId.value ? parseInt(formElements.productId.value) : undefined,
            name: formElements.name.value,
            price: parseFloat(formElements.price.value),
            description: formElements.description.value,
            image: formElements.image.value,
            stock: parseInt(formElements.stock.value),
            category: formElements.category.value,
            genre: formElements.genre.value,
            type: formElements.type.value,
            platform: formElements.platform.value,
            featured: formElements.featured.checked, // Pega o valor do checkbox
            reviews: []
        };
    }

    function clearForm() {
        form.reset();
        formElements.productId.value = '';
        formElements.featured.checked = false;
    }

    function toggleCategoryFields() {
        const isGame = categorySelect.value === 'jogo';
        document.getElementById('genre-group').style.display = isGame ? 'block' : 'none';
        document.getElementById('type-group').style.display = !isGame ? 'block' : 'none';
    }
    
    categorySelect.addEventListener('change', toggleCategoryFields);

    btnInsert.addEventListener('click', async () => {
        const productData = getFormData();
        delete productData.id;

        await fetch(API_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData),
        });
        alert('Produto inserido com sucesso!');
        clearForm();
        fetchAndDisplayProducts();
    });

    btnUpdate.addEventListener('click', async () => {
        const id = formElements.productId.value;
        if (!id) return alert('Selecione um produto para alterar.');
        
        const productData = getFormData();
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData),
        });
        alert('Produto alterado com sucesso!');
        clearForm();
        fetchAndDisplayProducts();
    });

    btnDelete.addEventListener('click', async () => {
        const id = formElements.productId.value;
        if (!id) return alert('Selecione um produto para excluir.');

        if (confirm('Tem certeza?')) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            alert('Produto excluído com sucesso!');
            clearForm();
            fetchAndDisplayProducts();
        }
    });
    
    btnClear.addEventListener('click', clearForm);

    fetchAndDisplayProducts();
    toggleCategoryFields();
});