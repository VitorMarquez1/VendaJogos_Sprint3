const axios = require('axios');
const fs = require('fs');

const RAWG_API_KEY = '3d41ef14468645628b28ce846179e583'; 
const GAMES_TO_FETCH = 100;
const PROBLEMATIC_GAME_ID = 407559; 

const genreMap = {
    "Action": "Ação", "Indie": "Indie", "Adventure": "Aventura", "RPG": "RPG", "Strategy": "Estratégia",
    "Shooter": "Tiro", "Casual": "Casual", "Simulation": "Simulação", "Puzzle": "Puzzle", "Arcade": "Arcade",
    "Platformer": "Plataforma", "Racing": "Corrida", "Massively Multiplayer": "MMO", "Sports": "Esportes",
    "Fighting": "Luta", "Family": "Família", "Board Games": "Jogos de Tabuleiro", "Educational": "Educacional",
    "Card": "Cartas"
};

function getRandomPrice(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

async function populateDatabase() {
    console.log('Iniciando a geração do banco de dados...');
    if (RAWG_API_KEY === 'SUA_API_KEY_VEM_AQUI' || !RAWG_API_KEY) {
        console.error('ERRO: Por favor, adicione sua API Key da RAWG na variável RAWG_API_KEY.');
        return;
    }

    try {
        // --- ETAPA 1: Ler o db.json existente para preservar usuários e pedidos ---
        let existingUsers = [];
        let existingOrders = [];
        if (fs.existsSync('db.json')) {
            console.log('Lendo db.json existente para preservar usuários e pedidos...');
            const existingData = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
            existingUsers = existingData.users || [];
            existingOrders = existingData.orders || [];
        }

        // --- ETAPA 2: Buscar dados dos jogos na API ---
        console.log(`Buscando a lista dos ${GAMES_TO_FETCH} melhores jogos...`);
        let gamesList = [];
        let page = 1;
        while (gamesList.length < GAMES_TO_FETCH) {
            const response = await axios.get(`https://api.rawg.io/api/games`, {
                params: { key: RAWG_API_KEY, page_size: 40, page: page++, ordering: '-metacritic' }
            });
            if (response.data.results.length === 0) break;
            gamesList.push(...response.data.results);
        }
        gamesList = gamesList.slice(0, GAMES_TO_FETCH);
        gamesList = gamesList.filter(game => game.id !== PROBLEMATIC_GAME_ID);

        console.log('Buscando detalhes de cada jogo...');
        const detailPromises = gamesList.map(game =>
            axios.get(`https://api.rawg.io/api/games/${game.id}`, { params: { key: RAWG_API_KEY } })
        );
        const detailResponses = await Promise.all(detailPromises);
        const gamesWithDetails = detailResponses.map(response => response.data);
        console.log('Detalhes dos jogos obtidos com sucesso.');

        const processedGames = gamesWithDetails.map(game => {
            const developer = game.developers && game.developers.length > 0 ? game.developers[0].name : 'desenvolvedor não informado';
            const releaseDate = game.released ? new Date(game.released).toLocaleDateString('pt-BR') : 'data não informada';
            const mainGenre = game.genres && game.genres.length > 0 ? (genreMap[game.genres[0].name] || game.genres[0].name) : 'gênero não informado';
            
            const creativeDescription = `Explore o mundo de ${game.name}, um aclamado jogo do gênero ${mainGenre} desenvolvido pela ${developer}. ` +
                                      `Lançado em ${releaseDate}, este título conquistou a crítica, alcançando a impressionante nota ${game.metacritic || 'N/A'} no Metacritic.`;

            return {
                id: game.id, name: game.name, price: parseFloat(getRandomPrice(50, 350)),
                description: creativeDescription, image: game.background_image, category: 'jogo',
                genre: mainGenre, platform: game.platforms.map(p => p.platform.name).join(' / '),
                stock: Math.floor(Math.random() * 50) + 10, reviews: [], featured: false
            };
        });
        console.log(`${processedGames.length} jogos foram processados.`);

        // --- ETAPA 3: Ler a lista de acessórios do arquivo local ---
        console.log("Lendo a lista de acessórios de 'acessorios.json'...");
        const accessories = fs.existsSync('acessorios.json') ? JSON.parse(fs.readFileSync('acessorios.json')) : [];
        if (accessories.length > 0) console.log(`${accessories.length} acessórios foram carregados.`);

        // --- ETAPA 4: Juntar tudo e salvar, PRESERVANDO USUÁRIOS E PEDIDOS ---
        const allProducts = [...processedGames, ...accessories];
        const finalDatabase = { 
            products: allProducts, 
            users: existingUsers, 
            orders: existingOrders 
        };

        console.log('Gerando o arquivo final db.json com usuários e pedidos preservados...');
        fs.writeFileSync('db.json', JSON.stringify(finalDatabase, null, 2));

        console.log(`\nSUCESSO! 🚀 O arquivo db.json foi atualizado com ${allProducts.length} produtos.`);

    } catch (error) {
        console.error('\nOcorreu um erro geral:', error.response ? error.response.data : error.message);
    }
}

populateDatabase();